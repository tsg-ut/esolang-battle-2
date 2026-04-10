import { problemIdSchema, listProblemsSchema } from '@esolang-battle/common';
import { findProblemById, findAllProblems } from '@esolang-battle/db';
import { router, publicProcedure } from '../trpc';

export const problemRouter = router({
  getProblem: publicProcedure
    .input(problemIdSchema)
    .query(async ({ ctx, input }) => {
      const problem = await findProblemById(ctx.prisma, input.problemId);
      if (!problem) return null;
      return {
        id: problem.id,
        title: problem.title,
        problemStatement: problem.problemStatement,
        contestId: problem.contestId,
        acceptedLanguages: problem.acceptedLanguages.map((lang) => ({
          id: lang.id,
          description: lang.description,
          dockerImageId: lang.dockerImageId,
        })),
      };
    }),
  listProblems: publicProcedure
    .input(listProblemsSchema)
    .query(async ({ ctx, input }) => {
      const problems = await findAllProblems(ctx.prisma, input.contestId);
      return problems.map((p) => ({
        id: p.id,
        contestId: p.contestId,
        title: p.title,
        problemStatement: p.problemStatement,
      }));
    }),
});
