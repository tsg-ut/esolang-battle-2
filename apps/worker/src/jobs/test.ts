import { prisma } from '@esolang-battle/db';
import { runCode } from '../lib/docker';

export type TestJobData = {
  code: string;
  languageId: number;
};

export async function processTest(data: TestJobData) {
  const language = await prisma.language.findUnique({ where: { id: data.languageId } });
  if (!language) throw new Error("Language not found");

  return await runCode(language.dockerImageId, data.code);
}
