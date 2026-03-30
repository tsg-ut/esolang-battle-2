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

export type SubmitCodeParams = {
  code: string;
  languageId: number;
  userId: number;
  problemId: number;
};

export async function submitCode({
  code,
  languageId,
  userId,
  problemId,
}: SubmitCodeParams) {
  const now = new Date();

  const submission = await prisma.submission.create({
    data: {
      code,
      codeLength: code.length,
      submittedAt: now,
      score: null,
      language: { connect: { id: languageId } },
      user: { connect: { id: userId } },
      problem: { connect: { id: problemId } },
    },
  });

  return submission;
}
