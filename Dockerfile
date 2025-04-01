# Stage 1: Build
FROM node:18-alpine AS builder

WORKDIR /app

# Copy package files first (caching optimization)
COPY package*.json ./

# Install dependencies (including devDependencies for build)
RUN npm install

# Copy source code
COPY . .

# ---

# Stage 2: Production
FROM node:18-alpine

WORKDIR /app

# Copy only production dependencies
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/src ./src

# Install PM2 globally (process manager)
RUN npm install -g pm2

# Environment variables
ENV NODE_ENV=production
ENV PORT=5000

# Expose port
EXPOSE 5000

# Run with PM2 (cluster mode)
CMD ["pm2-runtime", "start", "src/app.js", "-i", "max"]