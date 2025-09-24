# Backend Dockerfile

# 1) Build stage: install devDependencies and compile TypeScript
FROM node:20-alpine AS build
WORKDIR /app
# Force devDependencies to be installed (some builders set NODE_ENV=production)
ENV NODE_ENV=development
COPY package*.json ./
RUN npm ci --legacy-peer-deps || npm install --legacy-peer-deps
COPY . .
# Compile TypeScript without relying on executable bit of node_modules/.bin/tsc
RUN node ./node_modules/typescript/bin/tsc -p tsconfig.json

# 2) Runtime stage: production image with only prod deps and compiled JS
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY package*.json ./
# Install only production dependencies
RUN npm ci --omit=dev --legacy-peer-deps || npm install --omit=dev --legacy-peer-deps
# Copy compiled output
COPY --from=build /app/dist ./dist
# Expose API port
EXPOSE 3001
# Run production server
CMD ["node", "dist/server.js"]
