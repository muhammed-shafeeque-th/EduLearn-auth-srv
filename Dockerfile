# Stage 1: Builder
FROM node:20.19.4-alpine3.22 AS base

WORKDIR /app

ENV NODE_ENV=production

RUN corepack enable

# Stage 2: Dependency
FROM base AS deps

ENV NODE_ENV=development


# Install build essentials (for native deps like bcrypt)
RUN apk add --no-cache \
    python3 \
    make \
    g++ \
    curl \
    libc6-compat
# Copy package files first for caching
COPY package.json yarn.lock ./

# Use cache mount for faster repeated builds (BuildKit)
RUN --mount=type=cache,target=/usr/local/share/.cache/yarn \
    yarn install --frozen-lockfile --ignore-optional

# Stage 2: Dependency
FROM deps AS builder

# Copy source and configs
COPY tsconfig*.json ./
COPY src ./src
COPY proto ./proto

# Build (keep your existing build for stability)
RUN yarn run build

# Prune to production deps in builder
RUN yarn install --production --frozen-lockfile --ignore-optional


#  Cleanup unnecessary files from node_modules with node-prune
ARG NODE_PRUNE_VERSION=v1.0.2

# RUN wget -q \
#     https://github.com/tj/node-prune/releases/download/${NODE_PRUNE_VERSION}/node-prune_${NODE_PRUNE_VERSION#v}_Linux_x86_64.tar.gz \
#     -O /tmp/node-prune.tar.gz \
#  && tar -xzf /tmp/node-prune.tar.gz -C /usr/local/bin \
# && chmod +x /usr/local/bin/node-prune \

RUN  apk add --no-cache curl \
  && curl -sfL https://gobinaries.com/tj/node-prune | sh -s -- -b /usr/local/bin \
  && node-prune \
  && yarn cache clean \
  && rm -rf \
       /tmp/* \
       /root/.cache \
       /usr/local/share/.cache

# Stage 2: Runtime (Lightweight)
FROM node:20.19.4-alpine3.22 AS runner

WORKDIR /app

ENV NODE_ENV=production


LABEL org.opencontainers.image.title="edulearn-auth"
LABEL org.opencontainers.image.description="EduLearn Authentication Service"
LABEL org.opencontainers.image.source="https://github.com/muhammed-shafeeque-th/Edulearn-auth"

# Non-root user
RUN addgroup -S edulearn_admin && adduser -S edulearn_user -G edulearn_admin

# Copy only essentials from builder
COPY --from=builder --chown=edulearn_user:edulearn_admin /app/dist ./dist
COPY --from=builder --chown=edulearn_user:edulearn_admin /app/node_modules ./node_modules
COPY --from=builder --chown=edulearn_user:edulearn_admin /app/package.json ./
COPY --from=builder --chown=edulearn_user:edulearn_admin /app/proto ./proto

# Copy Handlebars templates (adjust path if needed)
COPY --from=builder --chown=edulearn_user:edulearn_admin /app/src/shared/templates ./dist/shared/templates

# Logs dir
RUN mkdir -p /app/logs && chown edulearn_user:edulearn_admin /app/logs

USER edulearn_user

EXPOSE 4000

# Direct start (no yarn overhead, better signal handling)
CMD ["node", "dist/index.js"]