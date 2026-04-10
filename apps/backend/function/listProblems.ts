import { PrismaClient } from "@esolang-battle/db";

export type ProblemSummary = {
  id: number;
  contestId: number;
  title: string;
  problemStatement: string;
};

export async function listProblems(prisma: PrismaClient, contestId?: number): Promise<ProblemSummary[]> {
  const problems = await prisma.problem.findMany({
    where: contestId ? { contestId } : {},
    orderBy: { id: "asc" },
    select: {
      id: true,
      contestId: true,
      title: true,
      problemStatement: true,
    },
  });

  return problems.map((p) => ({
    id: p.id,
    contestId: p.contestId,
    title: p.title,
    problemStatement: p.problemStatement,
  }));
}
