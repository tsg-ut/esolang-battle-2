import { PrismaClient } from "@esolang-battle/db";
import type { UserInfo } from "@esolang-battle/common";

export async function getUsersWithTeams(prisma: PrismaClient): Promise<UserInfo[]> {
  const users = await prisma.user.findMany({
    orderBy: { id: "asc" },
    include: { teams: true },
  });

  return users.map((u) => ({
    id: u.id,
    name: u.name,
    isAdmin: Boolean(u.isAdmin),
    teams: u.teams.map((t) => ({ id: t.id, color: t.color, contestId: t.contestId })),
  }));
}
