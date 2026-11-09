FROM node:20 AS builder
WORKDIR /app

COPY tsconfig.base.json ./
COPY packages/bitez-contracts/package*.json packages/bitez-contracts/
COPY packages/bitez-contracts/tsconfig.json packages/bitez-contracts/
COPY packages/bitez-contracts/src packages/bitez-contracts/src
RUN cd packages/bitez-contracts && npm ci && npm run build
COPY packages/bitez-shared/package*.json packages/bitez-shared/
COPY packages/bitez-shared/tsconfig.json packages/bitez-shared/
COPY packages/bitez-shared/src packages/bitez-shared/src
RUN cd packages/bitez-shared && npm ci && npm run build

WORKDIR /app/services/restaurant
COPY services/restaurant/package*.json ./
RUN npm ci
COPY services/restaurant/ ./
RUN npm run build

FROM node:20-slim
WORKDIR /app/services/restaurant
COPY --from=builder /app/services/restaurant/package*.json ./
COPY --from=builder /app/services/restaurant/dist ./dist
COPY --from=builder /app/packages/bitez-contracts ../../packages/bitez-contracts
COPY --from=builder /app/packages/bitez-shared ../../packages/bitez-shared
RUN npm ci --omit=dev
EXPOSE 3002
CMD ["node", "dist/server.js"]
