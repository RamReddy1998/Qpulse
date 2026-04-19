FROM node:18-alpine AS builder

WORKDIR /app

# Install deps
COPY package*.json ./
RUN npm ci

# Install OpenSSL (required by Prisma)
RUN apk add --no-cache openssl

# Copy prisma first (important for caching + correctness)
COPY prisma ./prisma

# Generate Prisma client FIRST
RUN npx prisma generate

# Copy rest of code
COPY . .

# Build app
RUN npm run build


# ───────────── Runner ─────────────
FROM node:18-alpine AS runner

WORKDIR /app
ENV NODE_ENV=production

# Install deps
COPY package*.json ./
RUN npm ci --only=production

# Install OpenSSL
RUN apk add --no-cache openssl

# Copy built output + prisma
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma

# Generate again (safe + ensures runtime compatibility)
RUN npx prisma generate

EXPOSE 4000

CMD ["node", "dist/src/index.js"]
