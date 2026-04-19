import { z } from 'zod';

import { registerSchema } from '@esolang-battle/common';
import { registerUser } from '@esolang-battle/db';

import { protectedProcedure, publicProcedure, router } from '../trpc';

export const userRouter = router({
  me: publicProcedure.query(({ ctx }) => {
    return ctx.user ?? null;
  }),
  getMeFull: protectedProcedure.query(async ({ ctx }) => {
    return await ctx.prisma.user.findUnique({
      where: { id: ctx.user.id },
      include: {
        teams: {
          include: {
            contest: true,
          },
        },
      },
    });
  }),
  updateMe: protectedProcedure
    .input(z.object({ name: z.string().min(1).optional(), image: z.string().optional() }))
    .mutation(async ({ ctx, input }) => {
      return await ctx.prisma.user.update({
        where: { id: ctx.user.id },
        data: input,
      });
    }),
  revertToProviderImage: protectedProcedure.mutation(async ({ ctx }) => {
    const user = await ctx.prisma.user.findUnique({
      where: { id: ctx.user.id },
      select: { providerImage: true },
    });
    if (!user?.providerImage) throw new Error('Provider image not found');
    return await ctx.prisma.user.update({
      where: { id: ctx.user.id },
      data: { image: user.providerImage },
    });
  }),
  register: publicProcedure.input(registerSchema).mutation(async ({ ctx, input }) => {
    return await registerUser(ctx.prisma, input.email, input.name, input.password);
  }),
});
