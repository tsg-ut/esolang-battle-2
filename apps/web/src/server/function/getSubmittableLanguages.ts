import { PrismaClient, findBoardByContestId } from '@esolang-battle/db';

export type CellKey = string;

type RawCellKind = 'PLAYABLE' | 'FIXED' | 'FIX';

type RawPlacement = {
  id?: string;
  x?: number;
  y?: number;
  kind?: RawCellKind;
  languageId?: number;
  color?: string;
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
  if (typeof p.id === 'string' && p.id.length > 0) return p.id;
  if (typeof p.x === 'number' && typeof p.y === 'number') return `${p.x},${p.y}`;
  return null;
}

function endpointKey(ep: RawEdgesEndpoint): CellKey | null {
  if (typeof ep.id === 'string' && ep.id.length > 0) return ep.id;
  if (typeof ep.x === 'number' && typeof ep.y === 'number') return `${ep.x},${ep.y}`;
  return null;
}

function buildIndexByKey(placements: RawPlacement[]): Map<CellKey, number> {
  const indexByKey = new Map<CellKey, number>();
  placements.forEach((p, index) => {
    const key = placementKey(p);
    if (key !== null) indexByKey.set(key, index);
  });
  return indexByKey;
}

function buildAdjacency(placements: RawPlacement[], rawEdges: unknown): Map<number, number[]> {
  const adjacency = new Map<number, number[]>();
  const indexByKey = buildIndexByKey(placements);
  const edges = (rawEdges ?? []) as RawEdgesJson;
  if (!Array.isArray(edges)) return adjacency;

  for (const edge of edges) {
    if (!edge || !edge.from || !edge.to) continue;
    const fromKey = endpointKey(edge.from);
    const toKey = endpointKey(edge.to);
    if (fromKey === null || toKey === null) continue;
    const fromIndex = indexByKey.get(fromKey);
    const toIndex = indexByKey.get(toKey);
    if (fromIndex === undefined || toIndex === undefined) continue;

    let fromNeighbors = adjacency.get(fromIndex);
    if (!fromNeighbors) {
      fromNeighbors = [];
      adjacency.set(fromIndex, fromNeighbors);
    }
    fromNeighbors.push(toIndex);

    let toNeighbors = adjacency.get(toIndex);
    if (!toNeighbors) {
      toNeighbors = [];
      adjacency.set(toIndex, toNeighbors);
    }
    toNeighbors.push(fromIndex);
  }
  return adjacency;
}

function normalizeOwnerColor(raw: string | undefined): 'red' | 'blue' | 'neutral' {
  if (!raw) return 'neutral';
  const lower = raw.toLowerCase();
  if (lower === 'red' || lower === 'blue') return lower;
  return 'neutral';
}

export async function getSubmittableLanguageIdsForTeam(
  prisma: PrismaClient,
  teamId: number,
  contestId: number
): Promise<number[]> {
  const team = await prisma.team.findUnique({ where: { id: teamId } });
  if (!team) throw new Error(`Team ${teamId} not found`);

  const teamColor = normalizeOwnerColor(team.color);

  const board = await findBoardByContestId(prisma, contestId);
  if (!board) return [];

  const placements = (board.dispositionOfLanguages ?? []) as unknown as RawPlacement[];
  const colorConfig = (board.colorOfLanguages ?? {}) as unknown as RawColorOfLanguages;

  if (!Array.isArray(placements)) return [];

  const owners: ('red' | 'blue' | 'neutral')[] = placements.map((p) => {
    const kind: RawCellKind = p.kind ?? 'PLAYABLE';
    if (kind === 'FIXED') return normalizeOwnerColor(p.color);
    if (typeof p.languageId === 'number') {
      const raw = colorConfig[String(p.languageId)];
      return normalizeOwnerColor(raw);
    }
    return 'neutral';
  });

  const ownedIndices: number[] = [];
  owners.forEach((owner, index) => {
    if (owner === teamColor) ownedIndices.push(index);
  });

  const adjacency = buildAdjacency(placements, board.edges);

  const candidateIndices = new Set<number>();
  for (const idx of ownedIndices) {
    candidateIndices.add(idx);
    const neighbors = adjacency.get(idx) ?? [];
    for (const n of neighbors) candidateIndices.add(n);
  }

  const submittableLanguageIds = new Set<number>();
  candidateIndices.forEach((index) => {
    const placement = placements[index];
    if (!placement) return;
    const kind: RawCellKind = placement.kind ?? 'PLAYABLE';
    if (kind !== 'PLAYABLE') return;
    if (typeof placement.languageId === 'number') submittableLanguageIds.add(placement.languageId);
  });

  return Array.from(submittableLanguageIds.values()).sort((a, b) => a - b);
}
