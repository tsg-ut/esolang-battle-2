import { listProblemsSchema, problemIdSchema } from '@esolang-battle/common';
import { findAllProblems, findProblemById } from '@esolang-battle/db';

import { ensureContestAccess } from '../function/contest';
import { publicProcedure, router } from '../trpc';

export const problemRouter = router({
  getProblem: publicProcedure.input(problemIdSchema).query(async ({ ctx, input }) => {
    const problem = await findProblemById(ctx.prisma, input.problemId);
    if (!problem) return null;

    await ensureContestAccess(ctx.prisma, problem.contestId, ctx.user);

    let languages = problem.acceptedLanguages;
    if (languages.length === 0) {
      const { findAllLanguages } = await import('@esolang-battle/db');
      languages = await findAllLanguages(ctx.prisma);
    }

    return {
      id: problem.id,
      title: problem.title,
      problemStatement: problem.problemStatement,
      contestId: problem.contestId,
      testCases: problem.testCases
        .filter((tc) => tc.isSample)
        .map((tc) => ({
          id: tc.id,
          input: tc.input,
          output: tc.output,
        })),
      acceptedLanguages: languages.map((lang) => ({
        id: lang.id,
        name: lang.name,
        description: lang.description,
        dockerImageId: lang.dockerImageId,
      })),
    };
  }),
  listProblems: publicProcedure.input(listProblemsSchema).query(async ({ ctx, input }) => {
    if (input.contestId) {
      await ensureContestAccess(ctx.prisma, input.contestId, ctx.user);
    }
    const problems = await findAllProblems(ctx.prisma, input.contestId);
    return problems.map((p) => ({
      id: p.id,
      contestId: p.contestId,
      title: p.title,
      problemStatement: p.problemStatement,
    }));
  }),
});
