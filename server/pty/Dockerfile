FROM node:22-slim AS build

# Build tools required for native modules like node-pty
RUN apt-get update \
    && apt-get install -y --no-install-recommends \
    python3 \
    make \
    g++ \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /usr/src/app

# Enable pnpm via Corepack
RUN corepack enable

# Copy manifest + lockfile
COPY package.json pnpm-lock.yaml ./

# Install deps (dev + prod) using pnpm
RUN pnpm install --frozen-lockfile

# Copy the rest of the source and build
COPY . .
RUN pnpm run build

# Remove devDependencies from node_modules, keep only production deps
RUN pnpm prune --prod

FROM node:22-slim AS production

WORKDIR /usr/src/app

ENV NODE_ENV=production

# Copy production node_modules and built dist from build stage
COPY --from=build /usr/src/app/node_modules ./node_modules
COPY --from=build /usr/src/app/dist ./dist
COPY package.json ./

EXPOSE 3004
EXPOSE 3000
EXPOSE 5173

CMD ["node", "dist/main.js"]