# Build client
FROM node:22-alpine AS client-builder
WORKDIR /app
COPY apps/web-client/package*.json ./
RUN npm ci
COPY apps/web-client/ .
RUN npm run build

# Build server
FROM node:22-alpine AS server-builder
WORKDIR /app
COPY server/package*.json ./
RUN npm ci
COPY server/tsconfig.json ./
COPY server/src ./src
RUN npm run build

# Run
FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY server/package*.json ./
RUN npm ci --omit=dev
COPY --from=server-builder /app/dist ./dist
COPY --from=client-builder /app/dist ./public
EXPOSE 8080
CMD ["node", "dist/index.js"]