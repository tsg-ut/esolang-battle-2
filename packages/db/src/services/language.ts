import { PrismaClient } from '../../prisma/generated/client/index';

export async function findAllLanguages(prisma: PrismaClient) {
  return await prisma.language.findMany({
    orderBy: { id: 'asc' },
  });
}

export async function findLanguageById(prisma: PrismaClient, id: number) {
  return await prisma.language.findUnique({
    where: { id },
  });
}

export async function createLanguage(
  prisma: PrismaClient,
  data: { name: string; description: string; dockerImageId: string }
) {
  return await prisma.language.create({
    data,
  });
}

export async function updateLanguage(
  prisma: PrismaClient,
  id: number,
  data: { name?: string; description?: string; dockerImageId?: string }
) {
  return await prisma.language.update({
    where: { id },
    data,
  });
}

export async function deleteLanguage(prisma: PrismaClient, id: number) {
  return await prisma.language.delete({
    where: { id },
  });
}
