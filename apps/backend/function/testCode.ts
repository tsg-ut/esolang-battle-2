import fs from "fs/promises";
import path from "path";
import os from "os";
import { PrismaClient } from "@esolang-battle/db";
import { runCode } from "./runCode.js";

export type TestCodeParams = {
  languageId: number;
  code: string;
};

export async function testCode(prisma: PrismaClient, { languageId, code }: TestCodeParams) {
  const language = await prisma.language.findUnique({ where: { id: languageId } });

  if (!language) {
    throw new Error(`Language ${languageId} not found`);
  }

  const image = language.dockerImageId;
  if (!image) {
    throw new Error(`Language ${languageId} has no dockerImageId`);
  }

  const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "esolang-code-test-"));
  const codePath = path.join(tmpDir, "code");

  try {
    await fs.writeFile(codePath, code, "utf8");

    const result = await runCode(image, codePath);
    return result;
  } finally {
    await fs.rm(tmpDir, { recursive: true, force: true });
  }
}
