# Multi-stage build for production
FROM node:20-alpine AS base

# Install dependencies only when needed
FROM base AS deps
WORKDIR /app

# Copy package files
COPY package.json yarn.lock ./
COPY frontend/package.json ./frontend/
COPY backend/package.json ./backend/

# Install dependencies
RUN yarn install --frozen-lockfile

# Build stage
FROM base AS builder
WORKDIR /app

# Copy dependencies
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/frontend/node_modules ./frontend/node_modules
COPY --from=deps /app/backend/node_modules ./backend/node_modules

# Copy source code
COPY . .

# Generate Prisma client
RUN yarn prisma:generate

# Build backend
RUN yarn workspace backend build

# Build frontend
RUN yarn workspace frontend build

# Production stage
FROM base AS runner
WORKDIR /app

# Install production dependencies
RUN yarn global add pm2

# Copy built applications
COPY --from=builder /app/backend/dist ./backend/dist
COPY --from=builder /app/backend/package.json ./backend/
COPY --from=builder /app/backend/prisma ./backend/prisma
COPY --from=builder /app/frontend/dist ./frontend/dist

# Copy production node_modules
COPY --from=deps /app/backend/node_modules ./backend/node_modules

# Create non-root user
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs
USER nextjs

# Expose ports
EXPOSE 3001 3002

# Start the application
CMD ["pm2-runtime", "start", "ecosystem.config.js"]


