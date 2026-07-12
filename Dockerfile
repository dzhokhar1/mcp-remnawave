# --- build stage: compile from source inside the image (reproducible provenance) ---
FROM node:22-alpine AS build
WORKDIR /app
COPY package*.json tsconfig.json tsup.config.ts ./
COPY src/ ./src/
RUN npm ci && npm run build

# --- runtime stage ---
FROM node:22-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production
COPY package*.json ./
RUN npm ci --omit=dev && npm cache clean --force
COPY --from=build /app/dist ./dist
# Drop privileges: run as the built-in unprivileged `node` user, never root.
USER node
# stdio transport only — no network port is exposed.
CMD ["node", "dist/index.js"]
