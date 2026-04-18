# --- Base stage ---
FROM node:22-alpine AS base
WORKDIR /app
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable

# --- Dependencies stage ---
FROM base AS deps
COPY package.json package-lock.json ./
COPY apps/web/package.json ./apps/web/
COPY apps/worker/package.json ./apps/worker/
COPY packages/db/package.json ./packages/db/
COPY packages/common/package.json ./packages/common/
RUN npm ci

# --- Build stage ---
FROM deps AS builder
COPY . .
RUN npm run build:common
RUN npm run build:db
RUN cd apps/web && npm run build
RUN cd apps/worker && npm run build

# --- Migration stage (Lightweight) ---
FROM base AS migration
# Prismaのマイグレーション実行に必要な最小限のファイルをコピー
COPY --from=builder /app/packages/db/prisma /app/packages/db/prisma
COPY --from=builder /app/packages/db/prisma.config.ts /app/packages/db/
COPY --from=builder /app/packages/db/package.json /app/packages/db/
COPY --from=builder /app/node_modules /app/node_modules
WORKDIR /app/packages/db
ENV NODE_ENV=production
# デフォルトで実行するコマンド
CMD ["npx", "prisma", "migrate", "deploy"]

# --- Web production stage ---
FROM base AS web
ENV NODE_ENV=production
COPY --from=builder /app/apps/web/.next/standalone /app
COPY --from=builder /app/apps/web/.next/static /app/apps/web/.next/static
COPY --from=builder /app/apps/web/public* /app/apps/web/public/
EXPOSE 3000
CMD ["node", "apps/web/server.js"]

# --- Worker production stage ---
FROM base AS worker
RUN apk add --no-cache docker-cli
ENV NODE_ENV=production
COPY --from=builder /app/apps/worker/dist /app/apps/worker/dist
COPY --from=builder /app/packages/db/prisma /app/packages/db/prisma
COPY --from=builder /app/node_modules /app/node_modules
WORKDIR /app/apps/worker
CMD ["node", "dist/index.js"]
