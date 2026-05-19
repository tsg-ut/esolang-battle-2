import { getAvatarUrl } from '@/utils/user';
import { z } from 'zod';

import { registerSchema } from '@esolang-battle/common';
import { registerUser } from '@esolang-battle/db';

import { protectedProcedure, publicProcedure, router } from '../trpc';

export const userRouter = router({
  me: publicProcedure.query(({ ctx }) => {
    if (!ctx.user) return null;
    return {
      ...ctx.user,
      image: getAvatarUrl(ctx.user.id, !!ctx.user.image),
    };
  }),
  getMeFull: protectedProcedure.query(async ({ ctx }) => {
    const user = await ctx.prisma.user.findUnique({
      where: { id: ctx.user.id },
      include: {
        accounts: true,
        teams: {
          include: {
            contest: true,
          },
        },
      },
    });
    if (!user) return null;
    return {
      ...user,
      image: getAvatarUrl(user.id, !!user.image),
      hasPassword: !!user.password,
    };
  }),
  updateMe: protectedProcedure
    .input(z.object({ name: z.string().min(1).optional(), image: z.string().optional() }))
    .mutation(async ({ ctx, input }) => {
      return await ctx.prisma.user.update({
        where: { id: ctx.user.id },
        data: input,
      });
    }),
  updatePassword: protectedProcedure
    .input(
      z.object({
        currentPassword: z.string().optional(),
        newPassword: z.string().min(4),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const user = await ctx.prisma.user.findUnique({
        where: { id: ctx.user.id },
        select: { password: true },
      });

      if (!user) throw new Error('User not found');

      const bcrypt = await import('bcryptjs');

      // すでにパスワードがある場合は、現在のパスワードを検証
      if (user.password) {
        if (!input.currentPassword) throw new Error('現在のパスワードが必要です');
        const ok = await bcrypt.default.compare(input.currentPassword, user.password);
        if (!ok) throw new Error('現在のパスワードが正しくありません');
      }

      const hashedPassword = await bcrypt.default.hash(input.newPassword, 10);
      await ctx.prisma.user.update({
        where: { id: ctx.user.id },
        data: { password: hashedPassword },
      });

      return { success: true };
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
  getUserProfile: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const user = await ctx.prisma.user.findUnique({
        where: { id: input.id },
        select: {
          id: true,
          name: true,
          image: true,
          createdAt: true,
          teams: {
            include: {
              contest: true,
            },
          },
        },
      });
      if (!user) return null;
      return {
        ...user,
        image: getAvatarUrl(user.id, !!user.image),
      };
    }),
});
