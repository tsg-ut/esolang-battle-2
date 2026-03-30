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

export type AdminProblem = {
  id: number;
  contestId: number;
  problemStatement: string;
};

export async function listProblemsForAdmin(): Promise<AdminProblem[]> {
  const problems = await prisma.problem.findMany({
    orderBy: { id: "asc" },
  });

  return problems.map((p) => ({
    id: p.id,
    contestId: p.contestId,
    problemStatement: p.problemStatement,
  }));
}

export async function createProblemForAdmin(
  contestId: number,
  problemStatement: string,
): Promise<AdminProblem> {
  const contest = await prisma.contest.findUnique({ where: { id: contestId } });
  if (!contest) {
    throw new Error("指定されたコンテストが存在しません");
  }

  const languages = await prisma.language.findMany();

  const created = await prisma.problem.create({
    data: {
      contestId,
      problemStatement,
      acceptedLanguages: {
        connect: languages.map((l) => ({ id: l.id })),
      },
    },
  });

  return {
    id: created.id,
    contestId: created.contestId,
    problemStatement: created.problemStatement,
  };
}

export async function updateProblemForAdmin(
  id: number,
  contestId: number,
  problemStatement: string,
): Promise<AdminProblem> {
  const contest = await prisma.contest.findUnique({ where: { id: contestId } });
  if (!contest) {
    throw new Error("指定されたコンテストが存在しません");
  }

  const updated = await prisma.problem.update({
    where: { id },
    data: {
      contestId,
      problemStatement,
    },
  });

  return {
    id: updated.id,
    contestId: updated.contestId,
    problemStatement: updated.problemStatement,
  };
}
