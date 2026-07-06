FROM oven/bun:1.3-alpine AS deps
WORKDIR /app

COPY package.json bun.lock ./
COPY frontend/package.json ./frontend/package.json
COPY backend/package.json ./backend/package.json
COPY shared/package.json ./shared/package.json
RUN bun install --frozen-lockfile \
  --filter '@tfg-horarios/backend' \
  --filter '@tfg-horarios/shared'

FROM oven/bun:1.3-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production

COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/backend/node_modules ./backend/node_modules
COPY --from=deps /app/shared/node_modules ./shared/node_modules
COPY package.json bun.lock tsconfig.base.json ./
COPY backend ./backend
COPY shared ./shared

WORKDIR /app/backend
EXPOSE 8080
CMD ["bun", "run", "src/index.ts"]
