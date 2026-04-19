FROM node:18-alpine AS builder

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm ci

# Install required system deps for Prisma
RUN apk add --no-cache openssl

# Copy source
COPY . .

# Generate Prisma client BEFORE build
RUN npx prisma generate

# Build app
RUN npm run build


# ───────────── Runner ─────────────
FROM node:18-alpine AS runner

WORKDIR /app
ENV NODE_ENV=production

# Install runtime deps
COPY package*.json ./
RUN npm ci --only=production

# Install OpenSSL again (needed at runtime too)
RUN apk add --no-cache openssl

# Copy built app + prisma
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma

# Generate Prisma client (safe redundancy)
RUN npx prisma generate

EXPOSE 4000

CMD ["node", "dist/src/index.js"]
