import { isUtf8 } from 'node:buffer';

import { PrismaClient } from '../../prisma/generated/client/index';

export type GetSubmissionsFilter = {
  userId?: string;
  userName?: string | { value: string; operator: string } | any;
  teamId?: number;
  problemId?: number | number[];
  languageId?: number | number[];
  contestId?: number;
  status?: string | string[];
  orderBy?: 'id' | 'submittedAt' | 'codeLength' | 'score';
  order?: 'asc' | 'desc';
  limit?: number;
  offset?: number;
};

export async function findSubmissions(prisma: PrismaClient, filter: GetSubmissionsFilter = {}) {
  const where: any = {};
  if (filter.userId) where.userId = filter.userId;

  if (filter.userName) {
    const nameVal = typeof filter.userName === 'object' ? filter.userName.value : filter.userName;
    const operator = typeof filter.userName === 'object' ? filter.userName.operator : 'contains';
    if (nameVal) {
      where.user = {
        name:
          operator === 'eq'
            ? { equals: nameVal, mode: 'insensitive' }
            : {
                contains: nameVal,
                mode: 'insensitive',
              },
      };
    }
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

  const [submissions, total] = await prisma.$transaction([
    prisma.submission.findMany({
      where,
      orderBy,
      take: filter.limit,
      skip: filter.offset,
      include: {
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
        language: true,
      },
    }),
    prisma.submission.count({ where }),
  ]);

  return {
    items: submissions.map((sub) => {
      const { code: _, ...rest } = sub;
      return rest;
    }),
    total,
  };
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
