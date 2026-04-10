import { PrismaClient } from "@esolang-battle/db";

export type SubmitCodeParams = {
  code: string;
  languageId: number;
  userId: number;
  problemId: number;
};

export async function submitCode(
  prisma: PrismaClient,
  {
    code,
    languageId,
    userId,
    problemId,
  }: SubmitCodeParams
) {
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
