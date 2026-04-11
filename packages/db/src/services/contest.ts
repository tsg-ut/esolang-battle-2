import { PrismaClient } from '../../prisma/generated/client/index';

export async function findAllContests(prisma: PrismaClient) {
  return await prisma.contest.findMany({
    orderBy: { id: 'asc' },
  });
}

export async function findContestById(prisma: PrismaClient, id: number) {
  return await prisma.contest.findUnique({
    where: { id },
  });
}

export async function createContest(
  prisma: PrismaClient,
  data: { name: string; startAt: Date; endAt: Date }
) {
  return await prisma.contest.create({
    data,
  });
}

export async function updateContest(
  prisma: PrismaClient,
  id: number,
  data: { name?: string; startAt?: Date; endAt?: Date }
) {
  return await prisma.contest.update({
    where: { id },
    data,
  });
}

export async function deleteContest(prisma: PrismaClient, id: number) {
  return await prisma.contest.delete({
    where: { id },
  });
}
