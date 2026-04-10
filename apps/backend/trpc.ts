import "dotenv/config";
import { initTRPC, TRPCError } from '@trpc/server';
import type { CreateFastifyContextOptions } from '@trpc/server/adapters/fastify';
import type { UserInfo } from '@esolang-battle/common';
import { prisma } from '@esolang-battle/db';

import { decode } from "next-auth/jwt";

export { prisma };

export const createContext = async ({ req, res }: CreateFastifyContextOptions) => {
  let user = (req as any).user as UserInfo | undefined;

  // NextAuth のクッキーからユーザーを取得
  if (!user) {
    const cookies = (req.headers.cookie || "").split(';').reduce((acc, c) => {
      const [k, v] = c.trim().split('=');
      if (k && v) acc[k] = v;
      return acc;
    }, {} as Record<string, string>);

    const token = cookies['next-auth.session-token'] || cookies['__Secure-next-auth.session-token'];
    if (token) {
      try {
        const decoded = await decode({
          token,
          secret: process.env.NEXTAUTH_SECRET || "",
        });
        if (decoded) {
          user = {
            id: Number(decoded.id),
            name: decoded.name || "",
            isAdmin: Boolean(decoded.isAdmin),
            teams: (decoded.teams as any[]) || [],
          };
        }
      } catch (err) {
        console.error("NextAuth token decode error:", err);
      }
    }
  }

  return {
    req,
    res,
    prisma,
    user,
  };
};

export type Context = Awaited<ReturnType<typeof createContext>>;

const t = initTRPC.context<Context>().create();

export const router = t.router;
export const publicProcedure = t.procedure;

// ログイン必須の Procedure
export const protectedProcedure = t.procedure.use(({ ctx, next }) => {
  if (!ctx.user) {
    throw new TRPCError({ code: 'UNAUTHORIZED' });
  }
  return next({
    ctx: {
      ...ctx,
      user: ctx.user,
    },
  });
});

// 管理者必須の Procedure
export const adminProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (!ctx.user.isAdmin) {
    throw new TRPCError({ code: 'FORBIDDEN' });
  }
  return next();
});
