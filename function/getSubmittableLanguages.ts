import "dotenv/config";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/prisma/client.js";
import type { OwnerColor } from "./getBoard.js";

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error("DATABASE_URL environment variable is not set");
}

const pool = new Pool({ connectionString: databaseUrl });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

export type CellKey = string;

type RawCellKind = "PLAYABLE" | "FIXED" | "FIX";

type RawPlacement = {
  // 汎用的なセル ID（あればこれを優先）
  id?: string;
  // GRID など 2D レイアウト用の座標（なければ id のみで識別する）
  x?: number;
  y?: number;
  kind?: RawCellKind;
  languageId?: number;
  color?: string; // FIXED の場合の所有色
};

type RawEdgesEndpoint = {
  id?: string;
  x?: number;
  y?: number;
};

type RawEdge = {
  from: RawEdgesEndpoint;
  to: RawEdgesEndpoint;
};

type RawEdgesJson = RawEdge[];

type RawColorOfLanguages = Record<string, string>;

function placementKey(p: RawPlacement): CellKey | null {
  if (typeof p.id === "string" && p.id.length > 0) {
    return p.id;
  }
  if (typeof p.x === "number" && typeof p.y === "number") {
    return `${p.x},${p.y}`;
  }
  return null;
}

function endpointKey(ep: RawEdgesEndpoint): CellKey | null {
  if (typeof ep.id === "string" && ep.id.length > 0) {
    return ep.id;
  }
  if (typeof ep.x === "number" && typeof ep.y === "number") {
    return `${ep.x},${ep.y}`;
  }
  return null;
}

function buildIndexByKey(placements: RawPlacement[]): Map<CellKey, number> {
  const indexByKey = new Map<CellKey, number>();

  placements.forEach((p, index) => {
    const key = placementKey(p);
    if (key !== null) {
      indexByKey.set(key, index);
    }
  });

  return indexByKey;
}

function buildAdjacency(
  placements: RawPlacement[],
  rawEdges: unknown,
): Map<number, number[]> {
  const adjacency = new Map<number, number[]>();
  const indexByKey = buildIndexByKey(placements);

  const edges = (rawEdges ?? []) as RawEdgesJson;
  if (!Array.isArray(edges)) {
    return adjacency;
  }

  for (const edge of edges) {
    if (!edge || !edge.from || !edge.to) continue;
    const fromKey = endpointKey(edge.from);
    const toKey = endpointKey(edge.to);
    if (fromKey === null || toKey === null) continue;

    const fromIndex = indexByKey.get(fromKey);
    const toIndex = indexByKey.get(toKey);

    if (fromIndex === undefined || toIndex === undefined) continue;

    // 無向グラフとして扱う
    if (!adjacency.has(fromIndex)) adjacency.set(fromIndex, []);
    if (!adjacency.has(toIndex)) adjacency.set(toIndex, []);

    adjacency.get(fromIndex)!.push(toIndex);
    adjacency.get(toIndex)!.push(fromIndex);
  }

  return adjacency;
}

function bfsReachable(
  startIndices: number[],
  adjacency: Map<number, number[]>,
): Set<number> {
  const visited = new Set<number>();
  const queue: number[] = [];

  for (const idx of startIndices) {
    if (!visited.has(idx)) {
      visited.add(idx);
      queue.push(idx);
    }
  }

  while (queue.length > 0) {
    const current = queue.shift()!;
    const neighbors = adjacency.get(current) ?? [];

    for (const next of neighbors) {
      if (!visited.has(next)) {
        visited.add(next);
        queue.push(next);
      }
    }
  }

  return visited;
}

function normalizeTeamColor(raw: string): OwnerColor {
  const lower = raw.toLowerCase();
  if (lower === "red" || lower === "blue") {
    return lower;
  }
  return "neutral";
}

function normalizeOwnerColor(raw: string | undefined): OwnerColor {
  if (!raw) return "neutral";
  const lower = raw.toLowerCase();
  if (lower === "red" || lower === "blue") return lower;
  return "neutral";
}

/**
 * 指定した boardId と teamId について、そのチームが提出可能な languageId のリストを返す。
 *
 * ルール:
 * - 自分の色が塗られたセルに対応する言語には提出可能。
 * - さらに、自分の色が塗られたセルに graph edges で連結しているセルに対応する言語にも提出可能。
 * - FIXED セルは言語を持たないので提出対象にはならないが、所有色が自分色なら到達元のセルになりうる。
 */
export async function getSubmittableLanguageIdsForTeam(
  boardId: number,
  teamId: number,
): Promise<number[]> {
  const team = await prisma.team.findUnique({ where: { id: teamId } });
  if (!team) {
    throw new Error(`Team ${teamId} not found`);
  }

  const teamColor = normalizeTeamColor(team.color);

  const boardRow = await prisma.board.findUnique({
    where: { id: boardId },
    select: {
      dispositionOfLanguages: true,
      colorOfLanguages: true,
      edges: true,
    },
  });

  if (!boardRow) {
    throw new Error(`Board ${boardId} not found`);
  }

  const placements = (boardRow.dispositionOfLanguages ?? []) as unknown as RawPlacement[];
  const colorConfig = (boardRow.colorOfLanguages ?? {}) as unknown as RawColorOfLanguages;

  if (!Array.isArray(placements)) {
    throw new Error("Board.dispositionOfLanguages JSON is not an array");
  }

  // 各セルの所有色を計算する
  const owners: OwnerColor[] = placements.map((p) => {
    const kind: RawCellKind = p.kind ?? "PLAYABLE";
    if (kind === "FIXED") {
      return normalizeOwnerColor(p.color);
    }

    if (typeof p.languageId === "number") {
      const raw = colorConfig[String(p.languageId)];
      return normalizeOwnerColor(raw);
    }

    return "neutral";
  });

  // 自分の色のセル index
  const ownedIndices: number[] = [];
  owners.forEach((owner, index) => {
    if (owner === teamColor) {
      ownedIndices.push(index);
    }
  });

  const adjacency = buildAdjacency(placements, boardRow.edges);

  const reachableIndices = bfsReachable(ownedIndices, adjacency);

  const submittableLanguageIds = new Set<number>();

  for (const index of reachableIndices) {
    const placement = placements[index];
    if (!placement) continue;

    const kind: RawCellKind = placement.kind ?? "PLAYABLE";
    if (kind !== "PLAYABLE") continue;

    if (typeof placement.languageId === "number") {
      submittableLanguageIds.add(placement.languageId);
    }
  }

  return Array.from(submittableLanguageIds.values()).sort((a, b) => a - b);
}
