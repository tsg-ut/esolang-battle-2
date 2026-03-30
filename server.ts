import http from "http";
import { submitCode } from "./function/submitCode.js";
import { runSubmission } from "./function/runSubmission.js";
import { getSubmissions } from "./function/getSubmissions.js";
import { getBoard } from "./function/getBoard.js";
import { getProblem } from "./function/getProblem.js";
import { testCode } from "./function/testCode.js";
import { getLanguages } from "./function/getLanguages.js";

const PORT = Number(process.env.PORT) || 3000;

function sendJson(res: http.ServerResponse, status: number, body: unknown) {
  const data = JSON.stringify(body);
  res.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Content-Length": Buffer.byteLength(data),
  });
  res.end(data);
}

function getCurrentUserId(req: http.IncomingMessage): number | null {
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

    // GET /api/submissions : Submission 一覧取得（自分の分のみ）
    if (req.method === "GET" && req.url.startsWith("/api/submissions")) {
      const currentUserId = getCurrentUserId(req);
      if (!currentUserId) {
        return sendJson(res, 401, { error: "Unauthorized" });
      }

      const url = new URL(req.url, `http://localhost:${PORT}`);
      const problemIdParam = url.searchParams.get("problemId");
      const languageIdParam = url.searchParams.get("languageId");

      const toNumber = (v: string | null): number | undefined => {
        if (v === null) return undefined;
        const n = Number(v);
        return Number.isFinite(n) ? n : undefined;
      };

      const problemId = toNumber(problemIdParam);
      const languageId = toNumber(languageIdParam);

      const filter: { userId?: number; problemId?: number; languageId?: number } = {
        userId: currentUserId,
      };
      if (typeof problemId === "number") filter.problemId = problemId;
      if (typeof languageId === "number") filter.languageId = languageId;

      const submissions = await getSubmissions(filter);

      return sendJson(res, 200, { submissions });
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
