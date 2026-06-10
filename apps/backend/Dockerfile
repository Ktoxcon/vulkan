FROM node:22-alpine AS build
RUN corepack enable
WORKDIR /repo
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml ./
COPY apps/backend/package.json ./apps/backend/package.json
RUN pnpm install --frozen-lockfile
COPY apps/backend ./apps/backend
RUN pnpm --filter @vulkan/backend build

FROM node:22-alpine AS frontend
RUN corepack enable
WORKDIR /repo
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml ./
COPY apps/frontend/package.json ./apps/frontend/package.json
RUN pnpm install --frozen-lockfile
COPY apps/frontend ./apps/frontend
RUN pnpm --filter @vulkan/frontend build

FROM node:22-alpine AS runtime
RUN corepack enable
ENV NODE_ENV=production
WORKDIR /repo
COPY --from=build /repo/pnpm-workspace.yaml /repo/package.json /repo/pnpm-lock.yaml ./
COPY --from=build /repo/apps/backend/package.json ./apps/backend/package.json
RUN pnpm install --frozen-lockfile --prod
COPY --from=build /repo/apps/backend/dist ./apps/backend/dist
COPY --from=build /repo/apps/backend/drizzle ./apps/backend/drizzle
COPY --from=frontend /repo/apps/frontend/dist ./apps/backend/public
WORKDIR /repo/apps/backend
CMD ["node", "dist/index.js"]
