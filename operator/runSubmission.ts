import "dotenv/config";
import fs from "fs/promises";
import path from "path";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/prisma/client.js";
import { runBrainfuckImage } from "./runImage.js";

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
    include: { language: true },
  });

  if (!submission) {
    throw new Error(`Submission ${submissionId} not found`);
  }

  const image = submission.language.dockerImageId;
  if (!image) {
    throw new Error(`Language ${submission.languageId} has no dockerImageId`);
  }

  const codePath = path.resolve("code.bf");
  await fs.writeFile(codePath, submission.code, "utf8");

  console.log("Using image:", image);
  console.log("Writing code to:", codePath);

  await runBrainfuckImage(image, codePath);
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
