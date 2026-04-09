import "dotenv/config";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/prisma/client.js";

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error("DATABASE_URL environment variable is not set");
}

const pool = new Pool({ connectionString: databaseUrl });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

export type UserWithTeam = {
  id: number;
  name: string;
  isAdmin: boolean;
  teams: { id: number; color: string, contestId: number }[];
};

export async function getUsersWithTeams(): Promise<UserWithTeam[]> {
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
