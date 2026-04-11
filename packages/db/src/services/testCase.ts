import { PrismaClient } from '../../prisma/generated/client/index';

export async function findTestCasesByProblemId(prisma: PrismaClient, problemId: number) {
  return await prisma.testCase.findMany({
    where: { problemId },
    orderBy: { id: 'asc' },
  });
}

export async function findTestCaseById(prisma: PrismaClient, id: number) {
  return await prisma.testCase.findUnique({
    where: { id },
  });
}

export async function upsertTestCase(
  prisma: PrismaClient,
  data: {
    id: number | null;
    problemId: number;
    input: string;
    output: string;
    isSample: boolean;
    checkerScript?: string | null;
  }
) {
  const { id, ...payload } = data;
  if (id) {
    return await prisma.testCase.update({
      where: { id },
      data: payload,
    });
  } else {
    return await prisma.testCase.create({
      data: payload,
    });
  }
}

export async function deleteTestCase(prisma: PrismaClient, id: number) {
  return await prisma.testCase.delete({
    where: { id },
  });
}
