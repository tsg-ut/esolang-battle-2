import "dotenv/config";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@esolang-battle/db";

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error("DATABASE_URL environment variable is not set");
}

const pool = new Pool({ connectionString: databaseUrl });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

export type AdminTestCase = {
  id: number;
  input: string;
  output: string;
  isSample: boolean;
  checkerScript: string | null;
};

export async function listTestCasesForProblem(problemId: number): Promise<AdminTestCase[]> {
  const tcs = await prisma.testCase.findMany({
    where: { problemId },
    orderBy: { id: "asc" },
  });

  return tcs.map((tc) => ({
    id: tc.id,
    input: tc.input,
    output: tc.output,
    isSample: tc.isSample,
    checkerScript: tc.checkerScript ?? null,
  }));
}

export async function createTestCaseForProblem(
  problemId: number,
  input: string,
  output: string,
  isSample: boolean,
  checkerScript: string | null,
): Promise<AdminTestCase> {
  const created = await prisma.testCase.create({
    data: {
      problemId,
      input,
      output,
      isSample,
      checkerScript,
    },
  });

  return {
    id: created.id,
    input: created.input,
    output: created.output,
    isSample: created.isSample,
    checkerScript: created.checkerScript ?? null,
  };
}
