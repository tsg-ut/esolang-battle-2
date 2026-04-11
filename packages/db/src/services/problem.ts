import { PrismaClient } from '../../prisma/generated/client/index';

export async function findAllProblems(prisma: PrismaClient, contestId?: number) {
  return await prisma.problem.findMany({
    where: contestId ? { contestId } : {},
    orderBy: { id: 'asc' },
  });
}

export async function findProblemById(prisma: PrismaClient, id: number) {
  return await prisma.problem.findUnique({
    where: { id },
    include: {
      acceptedLanguages: true,
    },
  });
}

export async function upsertProblem(
  prisma: PrismaClient,
  data: {
    id: number | null;
    contestId: number;
    title: string;
    problemStatement: string;
    checkerType?: any;
    checkerName?: string;
    checkerScript?: string | null;
    checkerConfig?: any;
    aggregatorType?: any;
    aggregatorName?: string;
    aggregatorScript?: string | null;
    aggregatorConfig?: any;
  }
) {
  const { id, ...payload } = data;
  if (id) {
    return await prisma.problem.update({
      where: { id },
      data: payload,
    });
  } else {
    return await prisma.problem.create({
      data: payload,
    });
  }
}

export async function deleteProblem(prisma: PrismaClient, id: number) {
  return await prisma.problem.delete({
    where: { id },
  });
}
