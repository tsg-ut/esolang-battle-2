import type { UserInfo } from "@esolang-battle/common";
import bcrypt from "bcryptjs";
import { PrismaClient } from "../prisma/generated/client/index";

export async function verifyUserLogin(prisma: PrismaClient, name: string, password: string): Promise<UserInfo | null> {
  const user = await prisma.user.findFirst({
    where: { name },
    include: { teams: true },
  });

  if (!user) return null;

  const ok = await bcrypt.compare(password, user.password);
  if (!ok) return null;

  return {
    id: user.id,
    name: user.name,
    isAdmin: Boolean(user.isAdmin),
    teams: user.teams.map((t) => ({ id: t.id, color: t.color, contestId: t.contestId })),
  };
}

export async function registerUser(prisma: PrismaClient, name: string, password: string): Promise<UserInfo> {
  const existing = await prisma.user.findFirst({ where: { name } });
  if (existing) {
    throw new Error("ユーザ名は既に使われています");
  }

  const hashed = await bcrypt.hash(password, 10);

  const created = await prisma.user.create({
    data: {
      name,
      password: hashed,
    },
    include: {
      teams: true,
    },
  });

  return {
    id: created.id,
    name: created.name,
    isAdmin: Boolean(created.isAdmin),
    teams: created.teams.map((t) => ({ id: t.id, color: t.color, contestId: t.contestId })),
  };
}

export async function getUserInfo(prisma: PrismaClient, userId: number): Promise<UserInfo | null> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { teams: true },
  });

  if (!user) return null;

  return {
    id: user.id,
    name: user.name,
    isAdmin: Boolean(user.isAdmin),
    teams: user.teams.map((t) => ({ id: t.id, color: t.color, contestId: t.contestId })),
  };
}
