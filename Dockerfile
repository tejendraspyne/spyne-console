# syntax=docker/dockerfile:1
# Build one app: docker build --build-arg APP_NAME=main --build-arg APP_PORT=3000 -t console-main .
#
# APP_NAME must match the package name in apps/<name>/package.json (e.g. admin-tools).

ARG APP_NAME=main
ARG APP_PORT=3000

FROM node:20-alpine AS base
RUN apk add --no-cache libc6-compat
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable && corepack prepare pnpm@10.12.4 --activate
WORKDIR /app

FROM base AS builder
ARG APP_NAME
COPY . .
RUN pnpm dlx turbo@2.10.0 prune "${APP_NAME}" --docker

FROM base AS installer
ARG APP_NAME
COPY --from=builder /app/out/json/ .
COPY --from=builder /app/out/pnpm-lock.yaml ./pnpm-lock.yaml
COPY .npmrc ./
RUN pnpm install --frozen-lockfile

COPY --from=builder /app/out/full/ .
RUN pnpm turbo run build --filter="${APP_NAME}"

FROM base AS runner
ARG APP_NAME
ARG APP_PORT
ENV NODE_ENV=production
ENV PORT=${APP_PORT}
ENV HOSTNAME=0.0.0.0

RUN addgroup --system --gid 1001 nodejs && adduser --system --uid 1001 nextjs

COPY --from=installer --chown=nextjs:nodejs /app/apps/${APP_NAME}/.next/standalone ./
COPY --from=installer --chown=nextjs:nodejs /app/apps/${APP_NAME}/.next/static ./apps/${APP_NAME}/.next/static
COPY --from=installer --chown=nextjs:nodejs /app/apps/${APP_NAME}/public ./apps/${APP_NAME}/public

USER nextjs
EXPOSE ${APP_PORT}
WORKDIR /app/apps/${APP_NAME}
CMD ["node", "server.js"]
