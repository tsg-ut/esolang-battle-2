import "dotenv/config";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/prisma/client.js";

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error("DATABASE_URL environment variable is not set");
}

const pool = new Pool({ connectionString: databaseUrl });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

export type OwnerColor = "red" | "blue" | "neutral";

export type BoardCellDto = {
  x: number;
  y: number;
  languageId: number | null;
  languageName: string | null;
  owner: OwnerColor;
  score: number | null;
  canSubmit: boolean;
};

export type BoardDto =
  | {
      viewerType: "GRID";
      width: number;
      height: number;
      cells: BoardCellDto[];
    };

type RawCellKind = "PLAYABLE" | "FIXED";

type RawLanguagePlacement = {
  x: number;
  y: number;
  kind?: RawCellKind; // 省略時は PLAYABLE とみなす
  languageId?: number; // kind=PLAYABLE のときだけ有効
  color?: OwnerColor; // kind=PERMA のときだけ有効
};

type RawColorOfLanguages = Record<string, OwnerColor>;
type RawScoresOfLanguages = Record<string, number>;

// 将来的には HONEYCOMB など他の viewerType にも対応したいが、
// 現状は GRID の場合のみ整形された Board 情報を返す。
export async function getBoard(boardId: number): Promise<BoardDto> {
  const board = await prisma.board.findUnique({
    where: { id: boardId },
    include: {
      contest: true,
    },
  });

  if (!board) {
    throw new Error(`Board ${boardId} not found`);
  }

  if (board.contest.viewerType !== "GRID") {
    throw new Error(
      `Board ${boardId} is not supported yet (viewerType=${board.contest.viewerType})`,
    );
  }

  const rawPlacements = (board.dispositionOfLanguages ?? []) as unknown as RawLanguagePlacement[];
  const rawColors = (board.colorOfLanguages ?? {}) as unknown as RawColorOfLanguages;
  const rawScores = (board.scoreOfLanguages ?? {}) as unknown as RawScoresOfLanguages;

  if (!Array.isArray(rawPlacements)) {
    throw new Error("Board.dispositionOfLanguages JSON is not an array");
  }

  const languageIds = Array.from(
    new Set(
      rawPlacements
        .map((p) => p.languageId)
        .filter((id): id is number => typeof id === "number"),
    ),
  );

  const languages = await prisma.language.findMany({
    where: { id: { in: languageIds } },
  });

  const languageById = new Map<number, (typeof languages)[number]>();
  for (const lang of languages) {
    languageById.set(lang.id, lang);
  }

  let maxX = 0;
  let maxY = 0;
  for (const p of rawPlacements) {
    if (typeof p.x === "number" && typeof p.y === "number") {
      if (p.x > maxX) maxX = p.x;
      if (p.y > maxY) maxY = p.y;
    }
  }

  const width = maxX + 1;
  const height = maxY + 1;

  const placementByKey = new Map<string, RawLanguagePlacement>();
  for (const p of rawPlacements) {
    const key = `${p.x},${p.y}`;
    placementByKey.set(key, p);
  }

  const cells: BoardCellDto[] = [];

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const key = `${x},${y}`;
      const placement = placementByKey.get(key);

      let languageId: number | null = null;
      let languageName: string | null = null;
      let owner: OwnerColor = "neutral";
      let score: number | null = null;

      if (placement) {
        const kind: RawCellKind = placement.kind ?? "PLAYABLE";

        if (kind === "FIXED") {
          const rawOwner = placement.color;
          if (rawOwner === "red" || rawOwner === "blue" || rawOwner === "neutral") {
            owner = rawOwner;
          }
        } else {
          if (typeof placement.languageId === "number") {
            languageId = placement.languageId;
            const lang = languageById.get(languageId);
            languageName = lang ? lang.description : null;

            const rawOwner = rawColors[String(languageId)];
            if (rawOwner === "red" || rawOwner === "blue" || rawOwner === "neutral") {
              owner = rawOwner;
            }

            const rawScore = rawScores[String(languageId)];
            if (typeof rawScore === "number") {
              score = rawScore;
            }
          }
        }
      }

      cells.push({
        x,
        y,
        languageId,
        languageName,
        owner,
        score,
        // 提出可否ロジックは後で埋める。今は常に false にしておく。
        canSubmit: false,
      });
    }
  }

  return {
    viewerType: "GRID",
    width,
    height,
    cells,
  };
}
