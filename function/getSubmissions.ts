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

export type GetSubmissionsFilter = {
  userId?: number;
  teamId?: number;
  problemId?: number;
  languageId?: number;
  contestId?: number;
};

export async function getSubmissions(filter: GetSubmissionsFilter = {}) {
  const where: any = {};

  if (typeof filter.userId === "number") {
    where.userId = filter.userId;
  }
  if (typeof filter.teamId === "number") {
    where.user = { ...(where.user ?? {}), teamId: filter.teamId };
  }
  if (typeof filter.problemId === "number") {
    where.problemId = filter.problemId;
  }
  if (typeof filter.languageId === "number") {
    where.languageId = filter.languageId;
  }

  if (typeof filter.contestId === "number") {
    where.problem = { ...(where.problem ?? {}), contestId: filter.contestId };
  }

  const submissions = await prisma.submission.findMany({
    where,
    orderBy: { submittedAt: "desc" },
    include: {
      user: {
        include: {
          team: true,
        },
      },
      problem: true,
      language: true,
    },
  });

  return submissions;
}
