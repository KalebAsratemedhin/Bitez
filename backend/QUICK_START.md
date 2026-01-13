# Quick Start Guide - Running and Testing Bitez Microservices

## Prerequisites

1. **Docker and Docker Compose** must be installed
   ```bash
   docker --version
   docker compose version
   ```

2. **Ports must be available:**
   - 5432 (PostgreSQL)
   - 5672 (RabbitMQ)
   - 15672 (RabbitMQ Management UI)
   - 8000 (Restaurants Service)
   - 8001 (Users Service)
   - 8080 (API Gateway)

## Step 1: Start All Services

Navigate to the backend directory and start all services:

```bash
cd /home/kaleb/projects/Bitez/backend
docker compose up --build
```

**What this does:**
- Builds Docker images for all services
- Starts PostgreSQL database
- Starts RabbitMQ message queue
- Starts Restaurants service
- Starts Users service
- Starts API Gateway
- Sets up networking between services

**First time:** This will take a few minutes as it downloads base images and builds your services.

**To run in background (detached mode):**
```bash
docker compose up -d --build
```

## Step 2: Verify Services Are Running

Check that all containers are up:

```bash
docker compose ps
```

You should see all services with status "Up" or "Up (healthy)".

## Step 3: Test the Services

### Option A: Using the Test Script

```bash
cd /home/kaleb/projects/Bitez/backend
./test-services.sh
```

### Option B: Manual Testing with curl

#### 1. Test API Gateway Health
```bash
curl http://localhost:8080/health
```

Expected response:
```json
{"status":"healthy","service":"api-gateway"}
```

#### 2. Test API Gateway Root
```bash
curl http://localhost:8080/
```

Expected response:
```json
{
  "service": "Bitez API Gateway",
  "version": "1.0.0",
  "status": "running",
  "environment": "development"
}
```

#### 3. Test Restaurants Service (via Gateway)
```bash
# Get all restaurants
curl http://localhost:8080/api/restaurants/restaurants
```

Expected response:
```json
{
  "restaurants": [
    {"id": 1, "name": "Pizza Palace", "city": "New York", "cuisine": "Italian"},
    {"id": 2, "name": "Burger House", "city": "Los Angeles", "cuisine": "American"},
    {"id": 3, "name": "Sushi World", "city": "San Francisco", "cuisine": "Japanese"}
  ],
  "count": 3
}
```

#### 4. Get Specific Restaurant
```bash
curl http://localhost:8080/api/restaurants/restaurants/1
```

#### 5. Create New Restaurant
```bash
curl -X POST http://localhost:8080/api/restaurants/restaurants \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Taco Express",
    "city": "Austin",
    "cuisine": "Mexican"
  }'
```

#### 6. Test Users Service (via Gateway)
```bash
# Get all users
curl http://localhost:8080/api/users/users
```

#### 7. Get Specific User
```bash
curl http://localhost:8080/api/users/users/1
```

#### 8. Create New User
```bash
curl -X POST http://localhost:8080/api/users/users \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Alice Johnson",
    "email": "alice@example.com",
    "role": "customer"
  }'
```

### Option C: Test Direct Service Access (Bypassing Gateway)

#### Restaurants Service Direct
```bash
curl http://localhost:8000/restaurants
curl http://localhost:8000/health
```

#### Users Service Direct
```bash
curl http://localhost:8001/users
curl http://localhost:8001/health
```

## Step 4: View Logs

### View all logs
```bash
docker compose logs -f
```

### View specific service logs
```bash
docker compose logs -f api-gateway
docker compose logs -f restaurants
docker compose logs -f users
```

## Step 5: Access Management UIs

### RabbitMQ Management UI
Open in browser: http://localhost:15672
- Username: `guest`
- Password: `guest`

You can see queues, exchanges, connections, etc.

## Step 6: Stop Services

### Stop services (keep containers)
```bash
docker compose stop
```

### Stop and remove containers
```bash
docker compose down
```

### Stop and remove containers + volumes (clean slate)
```bash
docker compose down -v
```

## Troubleshooting

### Port Already in Use
If you get "port already in use" error:
```bash
# Find what's using the port
sudo lsof -i :8080  # or whatever port

# Or change ports in docker-compose.yml
```

### Services Not Starting
```bash
# Check logs
docker compose logs

# Rebuild without cache
docker compose build --no-cache

# Start fresh
docker compose down -v
docker compose up --build
```

### Health Checks Failing
```bash
# Check if services are actually running
docker compose ps

# Check individual service health
curl http://localhost:8000/health  # restaurants
curl http://localhost:8001/health  # users
curl http://localhost:8080/health  # gateway
```

### Import Errors
If you see Python import errors, make sure:
1. The `shared` directory is being copied correctly in Dockerfiles
2. PYTHONPATH is set correctly in Dockerfiles
3. Build context is correct (should be `backend/` directory)

### Network Issues
```bash
# Check Docker network
docker network ls
docker network inspect backend_bitz-network

# Restart network
docker compose down
docker compose up
```

## Testing Checklist

- [ ] All services start successfully
- [ ] API Gateway health check returns 200
- [ ] Can access restaurants via gateway
- [ ] Can access users via gateway
- [ ] Can create new restaurant
- [ ] Can create new user
- [ ] Direct service access works
- [ ] RabbitMQ UI is accessible
- [ ] Logs show no errors

## Next Steps

Once everything is working:
1. Explore the code structure
2. Add more endpoints to services
3. Integrate with database (PostgreSQL)
4. Add RabbitMQ event publishing
5. Set up Kubernetes manifests

## Useful Commands Reference

```bash
# Start services
docker compose up --build

# Start in background
docker compose up -d --build

# View logs
docker compose logs -f

# Stop services
docker compose down

# Rebuild specific service
docker compose build restaurants

# Execute command in container
docker compose exec restaurants bash

# Check service status
docker compose ps

# View resource usage
docker stats
```
