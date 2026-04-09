import "dotenv/config";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/prisma/client.js";
import bcrypt from "bcryptjs";

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error("DATABASE_URL environment variable is not set");
}

const pool = new Pool({ connectionString: databaseUrl });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

export type UserInfo = {
  id: number;
  name: string;
  isAdmin: boolean;
  teams: { id: number; color: string, contestId: number }[];
};

export async function verifyUserLogin(name: string, password: string): Promise<UserInfo | null> {
  const user = await prisma.user.findFirst({
    where: { name },
    include: { teams: true },
  });

  if (!user) return null;

  // password は bcrypt ハッシュで保存されている前提
  const ok = await bcrypt.compare(password, user.password);
  if (!ok) return null;

  return {
    id: user.id,
    name: user.name,
    isAdmin: Boolean(user.isAdmin),
    teams: user.teams.map((t) => ({ id: t.id, color: t.color, contestId: t.contestId })),
  };
}

export async function registerUser(name: string, password: string): Promise<UserInfo> {
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

export async function getUserInfo(userId: number): Promise<UserInfo | null> {
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
