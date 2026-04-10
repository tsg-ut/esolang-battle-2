import { registerSchema } from '@esolang-battle/common';
import { registerUser } from '@esolang-battle/db';
import { router, publicProcedure } from '../trpc.js';

export const userRouter = router({
  me: publicProcedure.query(({ ctx }) => {
    return ctx.user ?? null;
  }),
  register: publicProcedure
    .input(registerSchema)
    .mutation(async ({ ctx, input }) => {
      return await registerUser(ctx.prisma, input.name, input.password);
    }),
});
