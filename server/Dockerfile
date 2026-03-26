FROM node:20 AS gateway-build
WORKDIR /app
COPY gateway/package*.json ./
RUN npm ci && npm install esbuild --no-save
COPY gateway/ ./
RUN mkdir -p dist && npx esbuild src/server.ts --bundle --platform=node --format=esm --outfile=dist/server.js --packages=external

# ---- Auth ----
FROM node:20 AS auth-build
WORKDIR /app
COPY services/auth/package*.json ./
RUN npm ci && npm install esbuild --no-save
COPY services/auth/ ./
RUN mkdir -p dist && npx esbuild src/server.ts --bundle --platform=node --format=esm --outfile=dist/server.js --packages=external

# ---- Restaurant ----
FROM node:20 AS restaurant-build
WORKDIR /app
COPY services/restaurant/package*.json ./
RUN npm ci && npm install esbuild --no-save
COPY services/restaurant/ ./
RUN mkdir -p dist && npx esbuild src/server.ts --bundle --platform=node --format=esm --outfile=dist/server.js --packages=external

# ---- Order ----
FROM node:20 AS order-build
WORKDIR /app
COPY services/order/package*.json ./
RUN npm ci && npm install esbuild --no-save
COPY services/order/ ./
RUN mkdir -p dist && npx esbuild src/server.ts --bundle --platform=node --format=esm --outfile=dist/server.js --packages=external

# ---- Delivery ----
FROM node:20 AS delivery-build
WORKDIR /app
COPY services/delivery/package*.json ./
RUN npm ci && npm install esbuild --no-save
COPY services/delivery/ ./
RUN mkdir -p dist && npx esbuild src/server.ts --bundle --platform=node --format=esm --outfile=dist/server.js --packages=external

# ---- Notification ----
FROM node:20 AS notification-build
WORKDIR /app
COPY services/notification/package*.json ./
RUN npm ci && npm install esbuild --no-save
COPY services/notification/ ./
RUN mkdir -p dist && npx esbuild src/server.ts --bundle --platform=node --format=esm --outfile=dist/server.js --packages=external

# ---- Dashboard ----
FROM node:20 AS dashboard-build
WORKDIR /app
COPY services/dashboard/package*.json ./
RUN npm ci && npm install esbuild --no-save
COPY services/dashboard/ ./
RUN mkdir -p dist && npx esbuild src/server.ts --bundle --platform=node --format=esm --outfile=dist/server.js --packages=external

# ---- Final image: start from mongo:6 (has MongoDB), add Node + RabbitMQ + our apps ----
FROM mongo:6
WORKDIR /app

# Install Node 20 (NodeSource) and RabbitMQ; keep MongoDB from base image
RUN apt-get update && apt-get install -y --no-install-recommends ca-certificates curl gnupg \
    && curl -fsSL https://deb.nodesource.com/setup_20.x | bash - \
    && apt-get install -y --no-install-recommends nodejs rabbitmq-server \
    && rm -rf /var/lib/apt/lists/* \
    && mkdir -p /data/db /data/log /var/lib/rabbitmq

# Persist MongoDB data: use -v bitez-mongo-data:/data/db when running the container
VOLUME /data/db

# Ensure RabbitMQ AMQP listener binds to all interfaces (so localhost:5672 works)
RUN mkdir -p /etc/rabbitmq && echo 'NODE_IP_ADDRESS=0.0.0.0' > /etc/rabbitmq/rabbitmq-env.conf

# Copy gateway
COPY --from=gateway-build /app/dist /app/gateway/dist
COPY --from=gateway-build /app/package*.json /app/gateway/
RUN cd /app/gateway && npm ci --omit=dev

# Copy auth
COPY --from=auth-build /app/dist /app/services/auth/dist
COPY --from=auth-build /app/package*.json /app/services/auth/
RUN cd /app/services/auth && npm ci --omit=dev

# Copy restaurant
COPY --from=restaurant-build /app/dist /app/services/restaurant/dist
COPY --from=restaurant-build /app/package*.json /app/services/restaurant/
RUN cd /app/services/restaurant && npm ci --omit=dev

# Copy order
COPY --from=order-build /app/dist /app/services/order/dist
COPY --from=order-build /app/package*.json /app/services/order/
RUN cd /app/services/order && npm ci --omit=dev

# Copy delivery
COPY --from=delivery-build /app/dist /app/services/delivery/dist
COPY --from=delivery-build /app/package*.json /app/services/delivery/
RUN cd /app/services/delivery && npm ci --omit=dev

# Copy notification
COPY --from=notification-build /app/dist /app/services/notification/dist
COPY --from=notification-build /app/package*.json /app/services/notification/
RUN cd /app/services/notification && npm ci --omit=dev

# Copy dashboard
COPY --from=dashboard-build /app/dist /app/services/dashboard/dist
COPY --from=dashboard-build /app/package*.json /app/services/dashboard/
RUN cd /app/services/dashboard && npm ci --omit=dev

COPY entrypoint.sh /app/entrypoint.sh
RUN chmod +x /app/entrypoint.sh

EXPOSE 8080
ENTRYPOINT ["/app/entrypoint.sh"]
