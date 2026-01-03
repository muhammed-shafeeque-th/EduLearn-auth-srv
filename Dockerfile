# Stage 1: Build
FROM node:20-alpine AS builder

WORKDIR /app

# Install build dependencies
RUN apk add --no-cache python3 make g++

# Install dependencies
COPY package.json yarn.lock ./
RUN yarn install --frozen-lockfile

# Copy the rest of the application code
COPY tsconfig*.json ./
COPY src ./src

# Build the TypeScript app
RUN yarn run build


# Stage 2: Lightweight production image
FROM node:20-alpine

WORKDIR /app

#  Create non-root user in final stage
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

# Copy built files and set ownership
COPY --from=builder --chown=appuser:appgroup /app/dist ./dist
COPY --from=builder --chown=appuser:appgroup /app/package.json ./package.json
COPY --from=builder --chown=appuser:appgroup /app/yarn.lock ./yarn.lock
COPY --from=builder --chown=appuser:appgroup /app/src/infrastructure/gRPC/protos ./dist/infrastructure/gRPC/protos

# Install only production dependencies
RUN yarn install --production --frozen-lockfile

# Install runtime tools
# RUN apk add --no-cache tini curl

# Create logs directory and set permissions
RUN mkdir -p /app/logs && chown appuser:appgroup /app/logs

# Switch to non-root user
USER appuser

# Expose port
EXPOSE 4000

# Start app
# ENTRYPOINT ["/sbin/tini", "--"]
CMD ["yarn", "run", "start"]
