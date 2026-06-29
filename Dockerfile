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

# Gateway routing for the `main` app: Next bakes rewrites() at build time, so
# the satellite server URLs must be present now (not just at runtime). These are
# empty for every other app and for independent-container builds of main, which
# makes main fall through to serving only itself. docker-compose.gateway.yml
# passes the Docker service URLs here so main proxies to its peers.
ARG CONSOLE_MICROFRONTEND_SERVER_URL=""
ARG LOGIN_MICROFRONTEND_SERVER_URL=""
ARG INVENTORY_MICROFRONTEND_SERVER_URL=""
ARG ADMIN_TOOLS_MICROFRONTEND_SERVER_URL=""
ARG VINI_MICROFRONTEND_SERVER_URL=""
ARG STUDIO_MICROFRONTEND_SERVER_URL=""
ARG DOCS_MICROFRONTEND_SERVER_URL=""
ENV CONSOLE_MICROFRONTEND_SERVER_URL=$CONSOLE_MICROFRONTEND_SERVER_URL \
    LOGIN_MICROFRONTEND_SERVER_URL=$LOGIN_MICROFRONTEND_SERVER_URL \
    INVENTORY_MICROFRONTEND_SERVER_URL=$INVENTORY_MICROFRONTEND_SERVER_URL \
    ADMIN_TOOLS_MICROFRONTEND_SERVER_URL=$ADMIN_TOOLS_MICROFRONTEND_SERVER_URL \
    VINI_MICROFRONTEND_SERVER_URL=$VINI_MICROFRONTEND_SERVER_URL \
    STUDIO_MICROFRONTEND_SERVER_URL=$STUDIO_MICROFRONTEND_SERVER_URL \
    DOCS_MICROFRONTEND_SERVER_URL=$DOCS_MICROFRONTEND_SERVER_URL

RUN pnpm turbo run build --filter="${APP_NAME}"
# Ensure a public/ exists even for apps that ship no static assets,
# so the runner-stage COPY below always has a source.
RUN mkdir -p "apps/${APP_NAME}/public"

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
