import { PrismaPg } from '@prisma/adapter-pg';
import 'dotenv/config';
import { Pool } from 'pg';

import { Prisma, PrismaClient } from '../prisma/generated/client/index';

export { PrismaClient, Prisma };

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function createPrismaClient() {
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    // 開発環境で DATABASE_URL がない場合は、
    // ビルド時などのためにダミーのアダプターかエラーを投げる
    if (process.env.NODE_ENV === 'production') {
      throw new Error('DATABASE_URL environment variable is not set');
    }
    // ビルド時などの回避策としてダミーURLを使用（実際のクエリ実行時にはエラーになる）
    const dummyUrl = 'postgresql://postgres:postgres@localhost:5432/dummy';
    const pool = new Pool({ connectionString: dummyUrl });
    const adapter = new PrismaPg(pool);
    return new PrismaClient({
      adapter,
      log: ['error'],
    });
  }

  const pool = new Pool({ connectionString: databaseUrl });
  const adapter = new PrismaPg(pool);
  return new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  });
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

export * from './auth';
export * from './services/contest';
export * from './services/language';
export * from './services/team';
export * from './services/user';
export * from './services/problem';
export * from './services/testCase';
export * from './services/submission';
export * from './services/board/index';
