FROM node:20 AS builder
WORKDIR /app

COPY packages/bitez-shared/package*.json packages/bitez-shared/
COPY packages/bitez-shared/tsconfig.json packages/bitez-shared/
COPY packages/bitez-shared/src packages/bitez-shared/
RUN cd packages/bitez-shared && npm ci && npm run build

WORKDIR /app/services/auth
COPY services/auth/package*.json ./
RUN npm ci
COPY services/auth/ ./
RUN npm run build

FROM node:20-slim
WORKDIR /app/services/auth
COPY --from=builder /app/services/auth/package*.json ./
COPY --from=builder /app/services/auth/dist ./dist
COPY --from=builder /app/packages/bitez-shared ../../packages/bitez-shared
RUN npm ci --omit=dev
EXPOSE 3001
CMD ["node", "dist/server.js"]
