import { isUtf8 } from 'node:buffer';

import { PrismaClient } from '../../prisma/generated/client/index';

export type GetSubmissionsFilter = {
  userId?: string;
  userName?: string;
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
  if (filter.userName) {
    where.user = {
      name: {
        contains: filter.userName,
        mode: 'insensitive',
      },
    };
  }
  if (filter.problemId) {
    where.problemId = Array.isArray(filter.problemId) ? { in: filter.problemId } : filter.problemId;
  }
  if (filter.languageId) {
    where.languageId = Array.isArray(filter.languageId)
      ? { in: filter.languageId }
      : filter.languageId;
  }
  if (filter.status) {
    const statuses = Array.isArray(filter.status) ? filter.status : [filter.status];
    if (statuses.includes('ALL') || statuses.length === 0) {
      // 'ALL' が含まれるか空ならフィルタしない
    } else {
      where.status = { in: statuses };
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

  const submissions = await prisma.submission.findMany({
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

  return submissions.map((sub) => {
    const { code: _, ...rest } = sub;
    return rest;
  });
}

export async function findSubmissionDetail(prisma: PrismaClient, id: number) {
  const submission = await prisma.submission.findUnique({
    where: { id },
    include: {
      language: true,
      user: {
        include: {
          teams: true,
        },
      },
      problem: {
        include: {
          contest: true,
        },
      },
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

  if (!submission) return null;

  const buffer = Buffer.from(submission.code);
  const isBinary = !isUtf8(buffer);

  // フロントエンドで扱いやすい形式に変換
  const { code: _, ...rest } = submission;
  return {
    ...rest,
    codeText: isBinary ? null : buffer.toString('utf8'),
    codeBase64: buffer.toString('base64'),
    isBinary,
  };
}

export async function createSubmission(
  prisma: PrismaClient,
  data: {
    code: string;
    isBase64?: boolean;
    languageId: number;
    userId: string;
    problemId: number;
  }
) {
  const codeBuffer = data.isBase64
    ? Buffer.from(data.code, 'base64')
    : Buffer.from(data.code, 'utf8');

  return await prisma.submission.create({
    data: {
      code: codeBuffer,
      codeLength: codeBuffer.length,
      submittedAt: new Date(),
      score: null,
      language: { connect: { id: data.languageId } },
      user: { connect: { id: data.userId } },
      problem: { connect: { id: data.problemId } },
    },
  });
}
