# API 컨테이너: tsx 로 TypeScript 를 직접 실행하고, 기동 시 마이그레이션을 적용한다.
FROM node:22-alpine AS base
RUN apk add --no-cache openssl && npm i -g pnpm@11.12.0
WORKDIR /app
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml .npmrc ./
COPY packages/shared/package.json packages/shared/
COPY apps/api/package.json apps/api/
COPY apps/api/prisma apps/api/prisma
RUN pnpm install --frozen-lockfile --filter "@routinebox/api..."
COPY packages/shared packages/shared
COPY apps/api apps/api
ENV NODE_ENV=production
EXPOSE 4000
CMD ["sh", "-c", "pnpm --filter @routinebox/api exec prisma migrate deploy && pnpm --filter @routinebox/api start"]
