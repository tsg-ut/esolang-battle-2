import { prisma } from '@esolang-battle/db';

import { runCode } from '../lib/docker';

export type TestJobData = {
  code: string;
  isBase64?: boolean;
  languageId: number;
  stdin?: string;
};

export async function processTest(data: TestJobData) {
  const language = await prisma.language.findUnique({ where: { id: data.languageId } });
  if (!language) throw new Error('Language not found');

  const codeData = data.isBase64 ? Buffer.from(data.code, 'base64') : data.code;
  return await runCode(language.dockerImageId, codeData, data.stdin || '');
}
