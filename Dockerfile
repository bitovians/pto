# pto/Dockerfile
# Multi-stage build for the Next.js frontend.
#
# Stage 1 (deps)     — install production dependencies only
# Stage 2 (builder)  — build the Next.js app
# Stage 3 (runner)   — minimal runtime image (~150 MB vs ~1 GB)

# ── Stage 1: Install dependencies ────────────────────────────────────────────
FROM node:18-alpine AS deps
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --omit=dev

# ── Stage 2: Build ────────────────────────────────────────────────────────────
FROM node:18-alpine AS builder
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# NEXT_PUBLIC_* vars must be available at build time.
# Pass them as build args and expose as env vars.
ARG NEXT_PUBLIC_API_BASE_URL=https://bitovi-pto.com/api
ENV NEXT_PUBLIC_API_BASE_URL=$NEXT_PUBLIC_API_BASE_URL

# next export produces a static export in /app/out
# next build is required first; basePath '/pto' is set in next.config.js
RUN npm run build

# ── Stage 3: Production runner ────────────────────────────────────────────────
FROM node:18-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production

# Create a non-root user
RUN addgroup --system --gid 1001 nodejs && \
    adduser  --system --uid 1001 nextjs

# Copy only what is needed to run `next start`
COPY --from=builder /app/public      ./public
COPY --from=builder /app/.next       ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/next.config.js ./next.config.js

USER nextjs

EXPOSE 3000

# next start serves the production build; does not need certs (TLS at ALB)
CMD ["npm", "run", "start"]
