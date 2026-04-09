import "dotenv/config";
import fastify from 'fastify';
import fastifyPassport from '@fastify/passport';
import fastifySecureSession from '@fastify/secure-session';
import fastifyFormbody from '@fastify/formbody';
import { Strategy as LocalStrategy } from 'passport-local';
import { fastifyTRPCPlugin } from '@trpc/server/adapters/fastify';
import { router, publicProcedure, createContext, prisma, protectedProcedure, adminProcedure } from './trpc.js';
import { verifyUserLogin, getUserInfo, registerUser } from './function/authUser.js';
import { z } from 'zod';
import type { UserInfo } from '@esolang-battle/common';

import { contestRouter } from './routers/contest.js';
import { problemRouter } from './routers/problem.js';
import { submissionRouter } from './routers/submission.js';
import { userRouter } from './routers/user.js';
import { adminRouter } from './routers/admin.js';

// --- tRPC Router ---
const appRouter = router({
  ...userRouter._def.procedures,
  ...contestRouter._def.procedures,
  ...problemRouter._def.procedures,
  ...submissionRouter._def.procedures,
  ...adminRouter._def.procedures,
});

export type AppRouter = typeof appRouter;

// --- Fastify Server ---
const server = fastify({
  logger: true,
});

server.register(fastifyFormbody);
server.register(fastifySecureSession, {
  key: Buffer.from(process.env.SESSION_SECRET || 'a'.repeat(32), 'utf8'),
  cookie: { path: '/', httpOnly: true },
});
server.register(fastifyPassport.initialize());
server.register(fastifyPassport.secureSession());

fastifyPassport.use('local', new LocalStrategy({
  usernameField: 'name',
  passwordField: 'password',
}, async (name, password, done) => {
  try {
    const user = await verifyUserLogin(prisma, name, password);
    if (!user) return done(null, false, { message: 'Invalid name or password' });
    return done(null, user);
  } catch (err) { return done(err); }
}));

fastifyPassport.registerUserSerializer(async (user: UserInfo) => user.id);
fastifyPassport.registerUserDeserializer(async (id: number) => await getUserInfo(prisma, id));

server.post('/api/login', {
  preValidation: fastifyPassport.authenticate('local'),
}, async (req, res) => req.user as UserInfo);

server.post('/api/logout', async (req, res) => {
  req.logout();
  return { success: true };
});

server.register(fastifyTRPCPlugin, {
  prefix: '/trpc',
  trpcOptions: { router: appRouter, createContext },
});

const start = async () => {
  try {
    const port = Number(process.env.PORT) || 3000;
    await server.listen({ port, host: '0.0.0.0' });
    console.log(`Server listening on port ${port}`);
  } catch (err) {
    server.log.error(err);
    process.exit(1);
  }
};

start();
