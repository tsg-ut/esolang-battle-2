# --- Base stage ---
FROM node:22-alpine AS base
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable
WORKDIR /app

FROM base AS base-builder
WORKDIR /app
COPY . .
RUN pnpm install -g turbo@2.9.6

# --- Prune stage ---
FROM base-builder AS pruner
RUN turbo prune @esolang-battle/worker --docker && mv out out-worker
RUN turbo prune @esolang-battle/db --docker && mv out out-db
RUN turbo prune @esolang-battle/web --docker && mv out out-web

# --- Builder stage ---
FROM base-builder AS builder
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --frozen-lockfile
RUN pnpm run build

# --- Migration stage ---
FROM base AS migration
WORKDIR /app
# db 用の剪定済み定義をコピー
COPY --from=pruner /app/out-db/json/ .
COPY --from=pruner /app/out-db/pnpm-lock.yaml ./pnpm-lock.yaml
# 本番依存関係のみインストール
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --prod --frozen-lockfile
# Prisma CLI をグローバルにインストール (ワークスペースの競合を回避)
RUN pnpm install -g prisma@7.7.0
# ビルド成果物と設定ファイルをコピー
COPY --from=builder /app/packages/db/prisma ./packages/db/prisma
COPY --from=builder /app/packages/db/prisma.config.ts ./packages/db/
WORKDIR /app/packages/db
ENV NODE_ENV=production
# グローバルな prisma コマンドを直接実行
CMD ["prisma", "migrate", "deploy"]

# --- Web production stage ---
FROM base AS web
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/apps/web/public* ./apps/web/public/
COPY --from=builder /app/apps/web/.next/standalone ./
COPY --from=builder /app/apps/web/.next/static ./apps/web/.next/static
EXPOSE 3000
CMD ["node", "apps/web/server.js"]

# --- Worker production stage ---
FROM base AS worker
RUN apk add --no-cache docker-cli
WORKDIR /app
ENV NODE_ENV=production
# worker 用の剪定済み定義をコピー
COPY --from=pruner /app/out-worker/json/ .
COPY --from=pruner /app/out-worker/pnpm-lock.yaml ./pnpm-lock.yaml
# 本番依存関係のみインストール
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --shamefully-hoist --prod --frozen-lockfile
# ビルド成果物をコピー
COPY --from=builder /app/apps/worker/dist ./apps/worker/dist
COPY --from=builder /app/packages/db/prisma ./packages/db/prisma
WORKDIR /app/apps/worker
CMD ["node", "dist/index.js"]
