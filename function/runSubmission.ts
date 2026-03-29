import "dotenv/config";
import fs from "fs/promises";
import path from "path";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/prisma/client.js";
import { runAllTestCasesInSingleContainer } from "./runCode.js";

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error("DATABASE_URL environment variable is not set");
}

const pool = new Pool({ connectionString: databaseUrl });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function runSubmission(submissionId: number) {
  const submission = await prisma.submission.findUnique({
    where: { id: submissionId },
    include: {
      language: true,
      problem: { include: { testCases: true } },
    },
  });

  if (!submission) {
    throw new Error(`Submission ${submissionId} not found`);
  }

  if (!submission.problem || submission.problem.testCases.length === 0) {
    throw new Error(
      `Problem ${submission.problemId} has no test cases; cannot create Execution`,
    );
  }

  const image = submission.language.dockerImageId;
  if (!image) {
    throw new Error(`Language ${submission.languageId} has no dockerImageId`);
  }

  const codePath = path.resolve("code.bf");
  await fs.writeFile(codePath, submission.code, "utf8");

  console.log("Using image:", image);
  console.log("Writing code to:", codePath);

  const dockerResults = await runAllTestCasesInSingleContainer(
    image,
    codePath,
    submission.problem!.testCases.map((tc) => ({ id: tc.id, input: tc.input })),
  );
  console.log(dockerResults);

  for (const testcase of submission.problem!.testCases) {
    const result = dockerResults[testcase.id]!;

    await prisma.execution.create({
      data: {
        testcase: { connect: { id: testcase.id } },
        submission: { connect: { id: submission.id } },
        status: result.exitCode === 0
                  ? (result.stdout === testcase.output ? "AC" : "WA")
                  : "RE",
        stdout: result.stdout,
        stderr: result.stderr,
        executionTime: result.durationMs,
        executedAt: new Date(),
      },
    });
  }
}

async function main() {
  const [, , idArg] = process.argv;
  if (!idArg) {
    console.error("Usage: npx tsx operator/runSubmission.ts <submissionId>");
    process.exit(1);
  }

  const submissionId = Number(idArg);
  if (!Number.isInteger(submissionId)) {
    console.error("submissionId must be an integer");
    process.exit(1);
  }

  try {
    await runSubmission(submissionId);
  } finally {
    await prisma.$disconnect();
  }
}

// CLI 実行前提
main().catch((err) => {
  console.error(err);
  process.exit(1);
});
