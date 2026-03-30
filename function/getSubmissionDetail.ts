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

export async function getSubmissionDetail(submissionId: number, userId: number) {
  const submission = await prisma.submission.findUnique({
    where: { id: submissionId },
    include: {
      language: true,
      problem: true,
      executions: {
        include: {
          testcase: true,
        },
        orderBy: {
          testcaseId: "asc",
        },
      },
    },
  });

  if (!submission || submission.userId !== userId) {
    return null;
  }

  return {
    id: submission.id,
    code: submission.code,
    codeLength: submission.codeLength,
    score: submission.score,
    submittedAt: submission.submittedAt,
    language: {
      id: submission.language.id,
      name: submission.language.name,
      description: submission.language.description,
    },
    problem: {
      id: submission.problem.id,
    },
    executions: submission.executions.map((e) => ({
      testcaseId: e.testcaseId,
      status: e.status,
      stdout: e.stdout,
      stderr: e.stderr,
      executionTime: e.executionTime,
      executedAt: e.executedAt,
      testcase: {
        id: e.testcase.id,
        input: e.testcase.input,
        output: e.testcase.output,
        isSample: e.testcase.isSample,
      },
    })),
  };
}
