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

/**
 * 外部サイト (大会ポータルなど) のブラウザから読み取り専用で取得できるよう、GET のみ CORS を許可する。
 * Allow-Credentials を付けないため Cookie は送られず、未ログイン扱い (公開情報のみ) になる。
 */
const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Max-Age': '86400',
};

const getHandler = async (req: Request) => {
  const res = await handler(req);
  const headers = new Headers(res.headers);
  for (const [key, value] of Object.entries(CORS_HEADERS)) headers.set(key, value);
  return new Response(res.body, { status: res.status, statusText: res.statusText, headers });
};

const optionsHandler = () => new Response(null, { status: 204, headers: CORS_HEADERS });

export {
  getHandler as GET,
  optionsHandler as OPTIONS,
  handler as POST,
  handler as PUT,
  handler as DELETE,
};
