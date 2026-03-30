import "dotenv/config";
import fs from "fs/promises";
import path from "path";
import os from "os";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/prisma/client.js";
import { runCode } from "./runCode.js";

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error("DATABASE_URL environment variable is not set");
}

const pool = new Pool({ connectionString: databaseUrl });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

export type TestCodeParams = {
  languageId: number;
  code: string;
};

export async function testCode({ languageId, code }: TestCodeParams) {
  const language = await prisma.language.findUnique({ where: { id: languageId } });

  if (!language) {
    throw new Error(`Language ${languageId} not found`);
  }

  const image = language.dockerImageId;
  if (!image) {
    throw new Error(`Language ${languageId} has no dockerImageId`);
  }

  const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "esolang-code-test-"));
  const codePath = path.join(tmpDir, "code.bf");

  try {
    await fs.writeFile(codePath, code, "utf8");

    const result = await runCode(image, codePath);
    return result;
  } finally {
    await fs.rm(tmpDir, { recursive: true, force: true });
  }
}
