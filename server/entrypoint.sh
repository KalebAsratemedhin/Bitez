#!/bin/sh
set -e

log() { echo "[entrypoint] $*"; }

# Only used to avoid infinite wait if a service never starts (e.g. crashed)
READINESS_SAFETY_CAP=600

# Use local Mongo and RabbitMQ when running the all-in-one image (no env override)
export MONGODB_URI="${MONGODB_URI:-mongodb://localhost:27017}"
export RABBITMQ_URL="${RABBITMQ_URL:-amqp://guest:guest@localhost:5672}"
export AUTH_SERVICE_URL="${AUTH_SERVICE_URL:-http://localhost:3001}"
export RESTAURANT_SERVICE_URL="${RESTAURANT_SERVICE_URL:-http://localhost:3002}"
export ORDER_SERVICE_URL="${ORDER_SERVICE_URL:-http://localhost:3003}"
export DELIVERY_SERVICE_URL="${DELIVERY_SERVICE_URL:-http://localhost:3004}"
export NOTIFICATION_SERVICE_URL="${NOTIFICATION_SERVICE_URL:-http://localhost:3005}"
export DASHBOARD_SERVICE_URL="${DASHBOARD_SERVICE_URL:-http://localhost:3006}"

# Poll until a TCP port is accepting connections (readiness), or safety cap
wait_for_port() {
  _port=$1
  _name=$2
  _tries=0
  while [ $_tries -lt $READINESS_SAFETY_CAP ]; do
    if node -e "const n=require('net');const c=n.createConnection(${_port},'127.0.0.1',()=>{c.destroy();process.exit(0)});c.on('error',()=>process.exit(1));c.setTimeout(2000,()=>{c.destroy();process.exit(1)})" 2>/dev/null; then
      log "$_name is ready (port ${_port})."
      return 0
    fi
    _tries=$((_tries + 1))
    sleep 1
  done
  log "WARNING: $_name did not become ready (port ${_port}) after ${READINESS_SAFETY_CAP}s."
  return 0
}

# ---- MongoDB ----
log "Starting MongoDB..."
mongod --bind_ip_all --dbpath /data/db --logpath /data/log/mongodb.log --fork
log "MongoDB started (pid $(cat /data/db/mongod.lock 2>/dev/null || echo 'unknown'))."

# ---- RabbitMQ ----
log "Starting RabbitMQ..."
rabbitmq-server -detached
log "RabbitMQ starting in background."

# Wait for infra to be ready (poll until ready)
log "Waiting for MongoDB to be ready..."
wait_for_port 27017 "MongoDB"
log "Waiting for RabbitMQ to be ready..."
wait_for_port 5672 "RabbitMQ"

# ---- Gateway first (background) so port 10000 is open before 3001 - Render then binds to 10000
log "Starting Gateway..."
node /app/gateway/dist/server.js &
GATEWAY_PID=$!

# ---- Node backend services ----
log "Starting Auth (port 3001)..."
PORT=3001 MONGODB_URI="${MONGODB_URI}/bitez_auth" RABBITMQ_URL="$RABBITMQ_URL" node /app/services/auth/dist/server.js &
log "Starting Restaurant (port 3002)..."
PORT=3002 MONGODB_URI="${MONGODB_URI}/bitez_restaurant" RABBITMQ_URL="$RABBITMQ_URL" node /app/services/restaurant/dist/server.js &
log "Starting Order (port 3003)..."
PORT=3003 MONGODB_URI="${MONGODB_URI}/bitez_order" RABBITMQ_URL="$RABBITMQ_URL" node /app/services/order/dist/server.js &
log "Starting Delivery (port 3004)..."
PORT=3004 MONGODB_URI="${MONGODB_URI}/bitez_delivery" RABBITMQ_URL="$RABBITMQ_URL" node /app/services/delivery/dist/server.js &
log "Starting Notification (port 3005)..."
PORT=3005 MONGODB_URI="${MONGODB_URI}/bitez_notification" RABBITMQ_URL="$RABBITMQ_URL" node /app/services/notification/dist/server.js &
log "Starting Dashboard (port 3006)..."
PORT=3006 MONGODB_URI="${MONGODB_URI}/bitez_dashboard" RABBITMQ_URL="$RABBITMQ_URL" node /app/services/dashboard/dist/server.js &

# Wait for each backend to be listening (poll until ready; gateway may 502/504 until then)
log "Waiting for backend services to be ready..."
wait_for_port 3001 "Auth"
wait_for_port 3002 "Restaurant"
wait_for_port 3003 "Order"
wait_for_port 3004 "Delivery"
wait_for_port 3005 "Notification"
wait_for_port 3006 "Dashboard"
log "All backend services are ready."

# Keep container alive; exit when gateway exits
wait $GATEWAY_PID
