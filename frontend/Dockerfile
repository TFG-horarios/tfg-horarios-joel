FROM oven/bun:1.3-alpine AS deps
WORKDIR /app

COPY package.json bun.lock ./
COPY frontend/package.json ./frontend/package.json
COPY backend/package.json ./backend/package.json
COPY shared/package.json ./shared/package.json
RUN bun install --frozen-lockfile \
  --filter '@tfg-horarios/frontend' \
  --filter '@tfg-horarios/backend' \
  --filter '@tfg-horarios/shared'

FROM deps AS builder
WORKDIR /app

ARG NEXT_PUBLIC_API_URL
ARG INTERNAL_API_URL
ARG COOKIE_SECURE=false

ENV NEXT_TELEMETRY_DISABLED=1
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
ENV INTERNAL_API_URL=$INTERNAL_API_URL
ENV COOKIE_SECURE=$COOKIE_SECURE

COPY tsconfig.base.json ./
COPY frontend ./frontend
COPY backend ./backend
COPY shared ./shared

RUN bun run --cwd frontend build

FROM node:24-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

COPY --from=builder /app/frontend/.next/standalone ./
COPY --from=builder /app/frontend/.next/static ./frontend/.next/static
COPY --from=builder /app/frontend/public ./frontend/public

EXPOSE 3000
CMD ["node", "frontend/server.js"]
