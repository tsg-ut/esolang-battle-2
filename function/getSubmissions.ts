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
  problemId?: number;
  languageId?: number;
};

export async function getSubmissions(filter: GetSubmissionsFilter = {}) {
  const where: any = {};

  if (typeof filter.userId === "number") {
    where.userId = filter.userId;
  }
  if (typeof filter.problemId === "number") {
    where.problemId = filter.problemId;
  }
  if (typeof filter.languageId === "number") {
    where.languageId = filter.languageId;
  }

  const submissions = await prisma.submission.findMany({
    where,
    orderBy: { submittedAt: "desc" },
    include: {
      user: true,
      problem: true,
      language: true,
    },
  });

  return submissions;
}
