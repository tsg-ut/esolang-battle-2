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

export type ContestSummary = {
  id: number;
  name: string;
  viewerType: string;
  startAt: string;
  endAt: string;
};

export async function getContests(): Promise<ContestSummary[]> {
  const contests = await prisma.contest.findMany({
    orderBy: { id: "asc" },
  });

  return contests.map((c) => ({
    id: c.id,
    name: c.name,
    viewerType: c.viewerType,
    startAt: c.startAt.toISOString(),
    endAt: c.endAt.toISOString(),
  }));
}
