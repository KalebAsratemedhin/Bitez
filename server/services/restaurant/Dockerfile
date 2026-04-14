FROM node:20 AS builder
WORKDIR /app

COPY packages/bitez-shared/package*.json packages/bitez-shared/
COPY packages/bitez-shared/tsconfig.json packages/bitez-shared/
COPY packages/bitez-shared/src packages/bitez-shared/
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
COPY --from=builder /app/packages/bitez-shared ../../packages/bitez-shared
RUN npm ci --omit=dev
EXPOSE 3002
CMD ["node", "dist/server.js"]
