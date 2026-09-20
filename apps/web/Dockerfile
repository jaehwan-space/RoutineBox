# Web 컨테이너: Next.js standalone 빌드
FROM node:22-alpine AS deps
RUN npm i -g pnpm@11.12.0
WORKDIR /app
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml .npmrc ./
COPY packages/shared/package.json packages/shared/
COPY apps/web/package.json apps/web/
RUN pnpm install --frozen-lockfile --filter "@routinebox/web..."

FROM deps AS build
ARG API_INTERNAL_URL=http://api:4000
# NEXT_PUBLIC_* 는 빌드 시 번들에 고정된다 (.env 는 .dockerignore 로 제외되므로 build args 로 받는다).
ARG NEXT_PUBLIC_TOSS_CLIENT_KEY=""
ARG NEXT_PUBLIC_PAYMENTS_MOCK=false
ENV API_INTERNAL_URL=$API_INTERNAL_URL NEXT_PUBLIC_API_BASE=/api NEXT_TELEMETRY_DISABLED=1 \
    NEXT_PUBLIC_TOSS_CLIENT_KEY=$NEXT_PUBLIC_TOSS_CLIENT_KEY NEXT_PUBLIC_PAYMENTS_MOCK=$NEXT_PUBLIC_PAYMENTS_MOCK
COPY packages/shared packages/shared
COPY apps/web apps/web
RUN pnpm --filter @routinebox/web build

FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production PORT=3000 HOSTNAME=0.0.0.0 NEXT_TELEMETRY_DISABLED=1
RUN addgroup -S nextjs && adduser -S nextjs -G nextjs
COPY --from=build --chown=nextjs:nextjs /app/apps/web/.next/standalone ./
COPY --from=build --chown=nextjs:nextjs /app/apps/web/.next/static ./apps/web/.next/static
COPY --from=build --chown=nextjs:nextjs /app/apps/web/public ./apps/web/public
USER nextjs
EXPOSE 3000
CMD ["node", "apps/web/server.js"]
