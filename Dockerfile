# Two runtime targets, `runner` (Next.js) and `worker` (pg-boss), built from one
# source tree. Both stay small on purpose: the server has 8.7GB of disk.

FROM node:22-alpine AS base
WORKDIR /app
RUN apk add --no-cache libc6-compat
ENV NEXT_TELEMETRY_DISABLED=1

FROM base AS deps
COPY package.json package-lock.json ./
RUN npm ci

FROM base AS build
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# `next build` imports the app's modules, which validate the environment on
# load. No database is reachable at build time and none is needed, so this
# placeholder satisfies the check. The real value comes from .env at runtime.
# `npm run build` runs next twice. Pass one writes the action manifest;
# extract writes `server-action-ids.json`; pass two inlines those ids into
# middleware via next.config `env`. One pass cannot do both.
RUN DATABASE_URL=postgresql://build:build@localhost:5432/build npm run build
# The worker, migrate and seed scripts are bundled to single files so their
# runtime images need no node_modules at all. pg-native is optional inside pg
# and is never installed.
RUN npx esbuild src/worker/index.ts \
      --bundle --platform=node --target=node22 --format=cjs \
      --external:pg-native --outfile=dist/worker.cjs \
 && npx esbuild src/server/db/migrate.ts \
      --bundle --platform=node --target=node22 --format=cjs \
      --external:pg-native --outfile=dist/migrate.cjs \
 && npm run bundle:seed

# --- Next.js app -------------------------------------------------------------
FROM base AS runner
ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME=0.0.0.0
RUN addgroup -S app && adduser -S app -G app

COPY --from=build --chown=app:app /app/.next/standalone ./
COPY --from=build --chown=app:app /app/.next/static ./.next/static
COPY --from=build --chown=app:app /app/public ./public
COPY --from=build --chown=app:app /app/dist/migrate.cjs ./dist/migrate.cjs
COPY --from=build --chown=app:app /app/dist/seed.cjs ./dist/seed.cjs
COPY --chown=app:app drizzle ./drizzle
COPY --chown=app:app docker-entrypoint.sh /usr/local/bin/docker-entrypoint.sh
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

USER app
EXPOSE 3000
# Migrations run here, in one place, before the app serves traffic.
ENTRYPOINT ["docker-entrypoint.sh"]
CMD ["node", "server.js"]

# --- pg-boss worker ----------------------------------------------------------
FROM base AS worker
ENV NODE_ENV=production
RUN addgroup -S app && adduser -S app -G app
COPY --from=build --chown=app:app /app/dist/worker.cjs ./worker.cjs
USER app
CMD ["node", "worker.cjs"]
