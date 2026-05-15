FROM node:20 AS builder
WORKDIR /app

COPY packages/bitez-shared/package*.json packages/bitez-shared/
COPY packages/bitez-shared/tsconfig.json packages/bitez-shared/
COPY packages/bitez-shared/src packages/bitez-shared/src
RUN cd packages/bitez-shared && npm ci && npm run build

WORKDIR /app/services/order
COPY services/order/package*.json ./
RUN npm ci
COPY services/order/ ./
RUN npm run build

FROM node:20-slim
WORKDIR /app/services/order
COPY --from=builder /app/services/order/package*.json ./
COPY --from=builder /app/services/order/dist ./dist
COPY --from=builder /app/packages/bitez-shared ../../packages/bitez-shared
RUN npm ci --omit=dev
EXPOSE 3003
CMD ["node", "dist/server.js"]
