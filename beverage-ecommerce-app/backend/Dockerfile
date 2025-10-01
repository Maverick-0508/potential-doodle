# Backend Dockerfile for Node.js Express application
FROM node:20-alpine AS base

# Install system dependencies
RUN apk add --no-cache libc6-compat

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
FROM base AS deps
# Copy lockfile too to ensure deterministic installs
COPY package-lock.json ./
RUN npm ci --only=production && npm cache clean --force

# Development dependencies for building
FROM base AS builder
RUN npm ci
COPY . .
# Build the application if build script exists
RUN npm run build || echo "No build script found, skipping build step"

# Production image
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production

# Create non-root user
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nodejs

# Copy production dependencies
COPY --from=deps /app/node_modules ./node_modules

# Copy application code
COPY --chown=nodejs:nodejs . .

# Ensure seeders are explicitly copied into the final image (avoid missing files from context/layer issues)
COPY --chown=nodejs:nodejs src/seeders ./src/seeders

# Copy entrypoint script for seeding and prestart tasks
COPY --chown=nodejs:nodejs src/entrypoint.js ./src/entrypoint.js

# Copy entrypoint and make executable
COPY --chown=nodejs:nodejs docker-entrypoint.sh /usr/local/bin/docker-entrypoint.sh
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

# Remove development files
RUN rm -rf .git .gitignore .env.example README.md

USER nodejs

EXPOSE 5000

ENV PORT=5000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD node -e "require('http').get('http://localhost:5000/api/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) })"

# Use the entrypoint to run seeders before starting
ENTRYPOINT ["/usr/local/bin/docker-entrypoint.sh"]
CMD ["npm", "start"]