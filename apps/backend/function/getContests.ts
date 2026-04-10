import { PrismaClient } from "@esolang-battle/db";

export type ContestSummary = {
  id: number;
  name: string;
  viewerType: string;
  startAt: string;
  endAt: string;
};

export async function getContests(prisma: PrismaClient): Promise<ContestSummary[]> {
  const contests = await prisma.contest.findMany({
    orderBy: { id: "asc" },
  });

  return contests.map((c) => ({
    id: c.id,
    name: c.name,
    viewerType: c.viewerType,
    startAt: c.startAt.toISOString(),
    endAt: c.endAt.toISOString(),
  }));
}
