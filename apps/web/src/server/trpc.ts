import { getServerSession } from 'next-auth';

import { authOptions } from '@/lib/auth';
import { TRPCError, initTRPC } from '@trpc/server';
import { OpenApiMeta } from 'trpc-to-openapi';

import { prisma } from '@esolang-battle/db';

export const createContext = async (opts: { req: Request }) => {
  // 1. Session based authentication (for browser)
  const session = await getServerSession(authOptions);
  if (session?.user) {
    return {
      prisma,
      user: session.user,
    };
  }

  // 2. Bearer token based authentication (for API)
  const authHeader = opts.req.headers.get('authorization');
  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    const apiToken = await prisma.apiToken.findUnique({
      where: { token },
      include: {
        user: {
          include: {
            teams: true,
          },
        },
      },
    });

    if (apiToken && (!apiToken.expiresAt || apiToken.expiresAt > new Date())) {
      return {
        prisma,
        user: {
          id: apiToken.user.id,
          name: apiToken.user.name,
          email: apiToken.user.email,
          image: apiToken.user.image,
          isAdmin: apiToken.user.isAdmin,
          teams: apiToken.user.teams.map((t) => ({
            id: t.id,
            name: t.name,
            color: t.color,
            contestId: t.contestId,
          })),
        },
      };
    }
  }

  return {
    prisma,
    user: undefined,
  };
};

export type Context = Awaited<ReturnType<typeof createContext>>;

const t = initTRPC.context<Context>().meta<OpenApiMeta>().create();

export const router = t.router;
export const publicProcedure = t.procedure;

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

export const adminProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (!ctx.user.isAdmin) {
    throw new TRPCError({ code: 'FORBIDDEN' });
  }
  return next();
});
