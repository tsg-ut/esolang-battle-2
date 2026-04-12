import { PrismaClient } from '../../prisma/generated/client/index';

export async function findAllTeams(prisma: PrismaClient) {
  return await prisma.team.findMany({
    orderBy: { id: 'asc' },
  });
}

export async function findTeamById(prisma: PrismaClient, id: number) {
  return await prisma.team.findUnique({
    where: { id },
  });
}

export async function createTeam(
  prisma: PrismaClient,
  data: { name?: string; color: string; contestId: number }
) {
  return await prisma.team.create({
    data,
  });
}

export async function updateTeam(
  prisma: PrismaClient,
  id: number,
  data: { name?: string; color?: string; contestId?: number }
) {
  return await prisma.team.update({
    where: { id },
    data,
  });
}

export async function deleteTeam(prisma: PrismaClient, id: number) {
  return await prisma.team.delete({
    where: { id },
  });
}
