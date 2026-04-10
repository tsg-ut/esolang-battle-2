import { PrismaClient } from "@esolang-battle/db";

export async function getLanguages(prisma: PrismaClient) {
  const languages = await prisma.language.findMany({
    orderBy: { id: "asc" },
  });

  return languages;
}
