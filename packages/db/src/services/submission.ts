import { PrismaClient } from '../../prisma/generated/client/index';

export type GetSubmissionsFilter = {
  userId?: number;
  teamId?: number;
  problemId?: number | number[];
  languageId?: number | number[];
  contestId?: number;
  status?: string | string[];
  orderBy?: 'id' | 'submittedAt' | 'codeLength' | 'score';
  order?: 'asc' | 'desc';
};

export async function findSubmissions(prisma: PrismaClient, filter: GetSubmissionsFilter = {}) {
  const where: any = {};
  if (filter.userId) where.userId = filter.userId;
  if (filter.problemId) {
    where.problemId = Array.isArray(filter.problemId) ? { in: filter.problemId } : filter.problemId;
  }
  if (filter.languageId) {
    where.languageId = Array.isArray(filter.languageId)
      ? { in: filter.languageId }
      : filter.languageId;
  }
  if (filter.status) {
    if (filter.status === 'ALL') {
      // Do nothing
    } else {
      where.status = Array.isArray(filter.status) ? { in: filter.status } : filter.status;
    }
  }
  if (filter.contestId) where.problem = { contestId: filter.contestId };
  if (filter.teamId) {
    where.user = {
      teams: {
        some: { id: filter.teamId },
      },
    };
  }

  const orderBy: any = {};
  if (filter.orderBy) {
    orderBy[filter.orderBy] = filter.order ?? 'desc';
  } else {
    orderBy.submittedAt = 'desc';
  }

  return await prisma.submission.findMany({
    where,
    orderBy,
    include: {
      user: {
        include: {
          teams: true,
        },
      },
      problem: true,
      language: true,
    },
  });
}

export async function findSubmissionDetail(prisma: PrismaClient, id: number) {
  return await prisma.submission.findUnique({
    where: { id },
    include: {
      language: true,
      problem: true,
      executions: {
        include: {
          testcase: true,
        },
        orderBy: {
          testcaseId: 'asc',
        },
      },
    },
  });
}

export async function createSubmission(
  prisma: PrismaClient,
  data: {
    code: string;
    languageId: number;
    userId: number;
    problemId: number;
  }
) {
  return await prisma.submission.create({
    data: {
      code: data.code,
      codeLength: data.code.length,
      submittedAt: new Date(),
      score: null,
      language: { connect: { id: data.languageId } },
      user: { connect: { id: data.userId } },
      problem: { connect: { id: data.problemId } },
    },
  });
}
