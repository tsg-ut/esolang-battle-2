import { PrismaClient } from "@esolang-battle/db";

export async function getProblem(prisma: PrismaClient, problemId: number) {
  const problem = await prisma.problem.findUnique({
    where: { id: problemId },
    include: {
      contest: true,
      acceptedLanguages: true,
    },
  });

  if (!problem) {
    return null;
  }

  return {
    id: problem.id,
    title: problem.title,
    problemStatement: problem.problemStatement,
    contestId: problem.contestId,
    acceptedLanguages: problem.acceptedLanguages.map((lang) => ({
      id: lang.id,
      description: lang.description,
      dockerImageId: lang.dockerImageId,
    })),
  };
}

export async function getFirstProblemByIdAsc(prisma: PrismaClient) {
  const problem = await prisma.problem.findFirst({
    orderBy: { id: "asc" },
    include: {
      contest: true,
      acceptedLanguages: true,
    },
  });

  if (!problem) {
    return null;
  }

  return {
    id: problem.id,
    title: problem.title,
    problemStatement: problem.problemStatement,
    contestId: problem.contestId,
    acceptedLanguages: problem.acceptedLanguages.map((lang) => ({
      id: lang.id,
      description: lang.description,
      dockerImageId: lang.dockerImageId,
    })),
  };
}
