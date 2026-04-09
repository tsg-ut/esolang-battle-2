import { z } from 'zod';
import { router, publicProcedure } from '../trpc.js';
import { registerUser } from '../function/authUser.js';

export const userRouter = router({
  me: publicProcedure.query(({ ctx }) => {
    return ctx.user ?? null;
  }),
  register: publicProcedure
    .input(z.object({ name: z.string(), password: z.string() }))
    .mutation(async ({ ctx, input }) => {
      return await registerUser(ctx.prisma, input.name, input.password);
    }),
});
