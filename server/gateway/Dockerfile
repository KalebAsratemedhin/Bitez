FROM node:20 AS builder
WORKDIR /app

COPY tsconfig.base.json ./
COPY packages/bitez-shared/package*.json packages/bitez-shared/
COPY packages/bitez-shared/tsconfig.json packages/bitez-shared/
COPY packages/bitez-shared/src packages/bitez-shared/src
RUN cd packages/bitez-shared && npm ci && npm run build

WORKDIR /app/gateway
COPY gateway/package*.json ./
RUN npm ci
COPY gateway/ ./
RUN npm run build

FROM node:20-slim
WORKDIR /app/gateway
COPY --from=builder /app/gateway/package*.json ./
COPY --from=builder /app/gateway/dist ./dist
COPY --from=builder /app/packages/bitez-shared ../../packages/bitez-shared
RUN npm ci --omit=dev
EXPOSE 8080
CMD ["node", "dist/server.js"]
