import http from "http";
import crypto from "crypto";
import { submitCode } from "./function/submitCode.js";
import { runSubmission } from "./function/runSubmission.js";
import { getSubmissions } from "./function/getSubmissions.js";
import { getBoard } from "./function/getBoard.js";
import { getProblem } from "./function/getProblem.js";
import { testCode } from "./function/testCode.js";
import { getLanguages } from "./function/getLanguages.js";
import { getSubmissionDetail } from "./function/getSubmissionDetail.js";
import { getSubmittableLanguageIdsForTeam } from "./function/getSubmittableLanguages.js";
import { getUserInfo, verifyUserLogin } from "./function/authUser.js";
import {
  updateBoardFromSubmissions,
  recomputeBoardFromSubmissions,
} from "./function/updateBoardFromSubmissions.js";

const PORT = Number(process.env.PORT) || 3000;

const sessions = new Map<string, number>(); // sid -> userId

function sendJson(
  res: http.ServerResponse,
  status: number,
  body: unknown,
  extraHeaders: http.OutgoingHttpHeaders = {},
) {
  const data = JSON.stringify(body);
  res.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Content-Length": Buffer.byteLength(data),
    ...extraHeaders,
  });
  res.end(data);
}

function parseCookies(req: http.IncomingMessage): Record<string, string> {
  const header = req.headers["cookie"];
  if (!header) return {};

  const cookies: Record<string, string> = {};
  const parts = header.split(";");
  for (const part of parts) {
    const [name, ...rest] = part.trim().split("=");
    if (!name) continue;
    const value = rest.join("=");
    cookies[name] = decodeURIComponent(value ?? "");
  }
  return cookies;
}

function getCurrentUserId(req: http.IncomingMessage): number | null {
  // 1. Cookie によるセッション
  const cookies = parseCookies(req);
  const sid = cookies["sid"];
  if (sid) {
    const userId = sessions.get(sid);
    if (typeof userId === "number" && userId > 0) {
      return userId;
    }
  }

  // 2. 互換性のため X-User-Id ヘッダも見る（開発用）
  const raw = req.headers["x-user-id"];
  if (!raw) return null;

  const value = Array.isArray(raw) ? raw[0] : raw;
  const n = Number(value);
  if (!Number.isFinite(n) || n <= 0) return null;
  return n;
}

const server = http.createServer(async (req, res) => {
  try {
    if (!req.url) {
      res.statusCode = 400;
      return res.end("Bad Request");
    }

    // POST /api/login : ログインしてセッションクッキーを発行
    if (req.method === "POST" && req.url === "/api/login") {
      const chunks: Buffer[] = [];
      for await (const chunk of req) {
        chunks.push(chunk as Buffer);
      }
      const rawBody = Buffer.concat(chunks).toString("utf8");

      let body: any;
      try {
        body = rawBody ? JSON.parse(rawBody) : {};
      } catch {
        return sendJson(res, 400, { error: "Invalid JSON" });
      }

      const { name, password } = body ?? {};
      if (typeof name !== "string" || typeof password !== "string") {
        return sendJson(res, 400, { error: "name and password are required" });
      }

      const user = await verifyUserLogin(name, password);
      if (!user) {
        return sendJson(res, 401, { error: "Invalid name or password" });
      }

      const sid = crypto.randomUUID();
      sessions.set(sid, user.id);

      const cookie = `sid=${encodeURIComponent(sid)}; Path=/; HttpOnly; SameSite=Lax`;

      return sendJson(
        res,
        200,
        { id: user.id, name: user.name, team: user.team },
        { "Set-Cookie": cookie },
      );
    }

    // POST /api/logout : セッションを破棄
    if (req.method === "POST" && req.url === "/api/logout") {
      const cookies = parseCookies(req);
      const sid = cookies["sid"];
      if (sid) {
        sessions.delete(sid);
      }
      const expiredCookie =
        "sid=; Path=/; HttpOnly; Max-Age=0; SameSite=Lax";
      return sendJson(res, 200, { ok: true }, { "Set-Cookie": expiredCookie });
    }

    // GET /api/me : 現在ログイン中のユーザ情報
    if (req.method === "GET" && req.url === "/api/me") {
      const currentUserId = getCurrentUserId(req);
      if (!currentUserId) {
        return sendJson(res, 401, { error: "Unauthorized" });
      }

      const user = await getUserInfo(currentUserId);
      if (!user) {
        return sendJson(res, 404, { error: "User not found" });
      }

      return sendJson(res, 200, user);
    }

    // POST /api/submissions : コード提出（認証必須）
    if (req.method === "POST" && req.url === "/api/submissions") {
      const currentUserId = getCurrentUserId(req);
      if (!currentUserId) {
        return sendJson(res, 401, { error: "Unauthorized" });
      }

      const chunks: Buffer[] = [];
      for await (const chunk of req) {
        chunks.push(chunk as Buffer);
      }
      const rawBody = Buffer.concat(chunks).toString("utf8");

      let body: any;
      try {
        body = rawBody ? JSON.parse(rawBody) : {};
      } catch {
        return sendJson(res, 400, { error: "Invalid JSON" });
      }

      const { code, languageId, problemId } = body ?? {};

      if (typeof code !== "string" || !code.length) {
        return sendJson(res, 400, { error: "code is required" });
      }
      if (typeof languageId !== "number") {
        return sendJson(res, 400, { error: "languageId must be a number" });
      }
      if (typeof problemId !== "number") {
        return sendJson(res, 400, { error: "problemId must be a number" });
      }

      // 0. 盤面ルールに基づく提出可否チェック（暫定実装）
      try {
        const user = await getUserInfo(currentUserId);
        if (!user || !user.team) {
          return sendJson(res, 400, { error: "チーム未所属のため提出できません" });
        }

        const teamId = user.team.id;
        const boardId = 1;
        const submittableLanguageIds = await getSubmittableLanguageIdsForTeam(boardId, teamId);
        if (!submittableLanguageIds.includes(languageId)) {
          return sendJson(res, 400, { error: "提出できません" });
        }
      } catch (e) {
        console.error("failed to check submittable languages", e);
        return sendJson(res, 500, { error: "この言語には現在提出できません" });
      }

      // 1. Submission を作成
      const submission = await submitCode({
        code,
        languageId,
        userId: currentUserId,
        problemId,
      });

      // 2. すぐ採点まで走らせる
      await runSubmission(submission.id);

      return sendJson(res, 201, { submissionId: submission.id });
    }

    // POST /api/code-test : コードテスト（DB に記録せず 1 回だけ実行）
    if (req.method === "POST" && req.url === "/api/code-test") {
      const chunks: Buffer[] = [];
      for await (const chunk of req) {
        chunks.push(chunk as Buffer);
      }
      const rawBody = Buffer.concat(chunks).toString("utf8");

      let body: any;
      try {
        body = rawBody ? JSON.parse(rawBody) : {};
      } catch {
        return sendJson(res, 400, { error: "Invalid JSON" });
      }

      const { code, languageId } = body ?? {};

      if (typeof code !== "string" || !code.length) {
        return sendJson(res, 400, { error: "code is required" });
      }
      if (typeof languageId !== "number") {
        return sendJson(res, 400, { error: "languageId must be a number" });
      }

      const result = await testCode({ languageId, code });
      return sendJson(res, 200, result);
    }

    // GET /api/submissions / /api/submissions/:id : Submission 一覧 or 詳細
    if (req.method === "GET" && req.url.startsWith("/api/submissions")) {
      const currentUserId = getCurrentUserId(req);
      if (!currentUserId) {
        return sendJson(res, 401, { error: "Unauthorized" });
      }

      const url = new URL(req.url, `http://localhost:${PORT}`);
      const segments = url.pathname.split("/").filter(Boolean); // ["api", "submissions", ":id?"]

      const toNumber = (v: string | null): number | undefined => {
        if (v === null) return undefined;
        const n = Number(v);
        return Number.isFinite(n) ? n : undefined;
      };

      // 詳細: /api/submissions/:id
      if (segments.length === 3) {
        const idSegment = segments[2];
        const submissionId = Number(idSegment);

        if (!Number.isFinite(submissionId) || submissionId <= 0) {
          return sendJson(res, 400, { error: "Invalid submission id" });
        }

        const user = await getUserInfo(currentUserId);
        if (!user) {
          return sendJson(res, 404, { error: "User not found" });
        }

        const detail = await getSubmissionDetail(submissionId, currentUserId, user.isAdmin);
        if (!detail) {
          return sendJson(res, 404, { error: "Submission not found" });
        }

        return sendJson(res, 200, detail);
      }

      // 一覧: /api/submissions
      const problemIdParam = url.searchParams.get("problemId");
      const languageIdParam = url.searchParams.get("languageId");
      const scopeParam = url.searchParams.get("scope");

      const problemId = toNumber(problemIdParam);
      const languageId = toNumber(languageIdParam);
      const scope = scopeParam === "team" || scopeParam === "all" ? scopeParam : "self";

      const user = await getUserInfo(currentUserId);
      if (!user) {
        return sendJson(res, 404, { error: "User not found" });
      }

      type SubmissionsFilter = {
        userId?: number;
        teamId?: number;
        problemId?: number;
        languageId?: number;
      };

      const filter: SubmissionsFilter = {};

      if (scope === "self") {
        filter.userId = currentUserId;
      } else if (scope === "team") {
        if (!user.team) {
          return sendJson(res, 400, { error: "チーム未所属のためチーム提出は参照できません" });
        }
        filter.teamId = user.team.id;
      } else if (scope === "all") {
        if (!user.isAdmin) {
          return sendJson(res, 403, { error: "管理者のみ全ての提出を参照できます" });
        }
        // no additional filter: all submissions
      }

      if (typeof problemId === "number") filter.problemId = problemId;
      if (typeof languageId === "number") filter.languageId = languageId;

      const submissions = await getSubmissions(filter);

      return sendJson(res, 200, { submissions });
    }

    // POST /api/boards/:id/update : Board を Submission から差分更新（管理者専用）
    if (req.method === "POST" && req.url.startsWith("/api/boards/") && req.url.endsWith("/update")) {
      const currentUserId = getCurrentUserId(req);
      if (!currentUserId) {
        return sendJson(res, 401, { error: "Unauthorized" });
      }

      const user = await getUserInfo(currentUserId);
      if (!user) {
        return sendJson(res, 404, { error: "User not found" });
      }
      if (!user.isAdmin) {
        return sendJson(res, 403, { error: "管理者のみ盤面を更新できます" });
      }

      const url = new URL(req.url, `http://localhost:${PORT}`);
      const segments = url.pathname.split("/").filter(Boolean); // ["api", "boards", ":id", "update"]
      const idSegment = segments[2];
      const boardId = Number(idSegment);

      if (!Number.isFinite(boardId) || boardId <= 0) {
        return sendJson(res, 400, { error: "Invalid board id" });
      }

      try {
        await updateBoardFromSubmissions(boardId);
        return sendJson(res, 200, { ok: true });
      } catch (e) {
        console.error("failed to update board", e);
        return sendJson(res, 500, { error: "Failed to update board" });
      }
    }

    // POST /api/boards/:id/recompute : Board を Submission からフル再計算（管理者専用）
    if (
      req.method === "POST" &&
      req.url.startsWith("/api/boards/") &&
      req.url.endsWith("/recompute")
    ) {
      const currentUserId = getCurrentUserId(req);
      if (!currentUserId) {
        return sendJson(res, 401, { error: "Unauthorized" });
      }

      const user = await getUserInfo(currentUserId);
      if (!user) {
        return sendJson(res, 404, { error: "User not found" });
      }
      if (!user.isAdmin) {
        return sendJson(res, 403, { error: "管理者のみ盤面を再計算できます" });
      }

      const url = new URL(req.url, `http://localhost:${PORT}`);
      const segments = url.pathname.split("/").filter(Boolean); // ["api", "boards", ":id", "recompute"]
      const idSegment = segments[2];
      const boardId = Number(idSegment);

      if (!Number.isFinite(boardId) || boardId <= 0) {
        return sendJson(res, 400, { error: "Invalid board id" });
      }

      try {
        await recomputeBoardFromSubmissions(boardId);
        return sendJson(res, 200, { ok: true });
      } catch (e) {
        console.error("failed to recompute board", e);
        return sendJson(res, 500, { error: "Failed to recompute board" });
      }
    }

    // GET /api/boards/:id : Board 情報取得（盤面表示用）
    if (req.method === "GET" && req.url.startsWith("/api/boards/")) {
      const url = new URL(req.url, `http://localhost:${PORT}`);
      const segments = url.pathname.split("/").filter(Boolean); // ["api", "boards", ":id"]

      const idSegment = segments[2];
      const boardId = Number(idSegment);

      if (!Number.isFinite(boardId) || boardId <= 0) {
        return sendJson(res, 400, { error: "Invalid board id" });
      }

      const board = await getBoard(boardId);
      return sendJson(res, 200, board);
    }

    // GET /api/submittable_languages : 盤面ルール上、現在提出可能な languageId 一覧（暫定で boardId=1, teamId=1）
    if (req.method === "GET" && req.url.startsWith("/api/submittable_languages")) {
      try {
        const currentUserId = getCurrentUserId(req);
        if (!currentUserId) {
          return sendJson(res, 401, { error: "Unauthorized" });
        }

        const user = await getUserInfo(currentUserId);
        if (!user || !user.team) {
          return sendJson(res, 400, { error: "チーム未所属のため提出可能言語を計算できません" });
        }

        const boardId = 1;
        const teamId = user.team.id;
        const languageIds = await getSubmittableLanguageIdsForTeam(boardId, teamId);
        return sendJson(res, 200, { languageIds });
      } catch (e) {
        console.error("failed to get submittable languages", e);
        return sendJson(res, 500, { error: "Failed to get submittable languages" });
      }
    }

    // GET /api/languages : 使用可能な言語一覧
    if (req.method === "GET" && req.url === "/api/languages") {
      const langs = await getLanguages();
      const languages = langs.map((l) => ({
        id: l.id,
        name: l.name,
        description: l.description,
      }));
      return sendJson(res, 200, { languages });
    }

    // GET /api/problems/:id : 問題文取得（とりあえず閲覧用）
    if (req.method === "GET" && req.url.startsWith("/api/problems/")) {
      const url = new URL(req.url, `http://localhost:${PORT}`);
      const segments = url.pathname.split("/").filter(Boolean); // ["api", "problems", ":id"]

      const idSegment = segments[2];
      const problemId = Number(idSegment);

      if (!Number.isFinite(problemId) || problemId <= 0) {
        return sendJson(res, 400, { error: "Invalid problem id" });
      }

      const problem = await getProblem(problemId);
      return sendJson(res, 200, problem);
    }

    // 未対応パス
    if (req.url === "/healthz") {
      return sendJson(res, 200, { status: "ok" });
    }

    res.statusCode = 404;
    res.end("Not Found");
  } catch (err) {
    console.error(err);
    if (!res.headersSent) {
      sendJson(res, 500, { error: "Internal Server Error" });
    } else {
      res.end();
    }
  }
});

server.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`);
});
