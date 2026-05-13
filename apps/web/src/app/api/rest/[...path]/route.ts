import { appRouter } from '@/server/routers/_app';
import { createContext } from '@/server/trpc';
import { createOpenApiFetchHandler } from 'trpc-to-openapi';

const handler = (req: Request) =>
  createOpenApiFetchHandler({
    endpoint: '/api/rest',
    router: appRouter,
    createContext,
    req,
  });

export { handler as GET, handler as POST, handler as PUT, handler as DELETE };
