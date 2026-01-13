# Bitez Backend - Microservices Setup

This directory contains the backend microservices infrastructure for the Bitez food delivery platform.

## Architecture

```
┌─────────────┐
│   Client    │
└──────┬──────┘
       │
       ▼
┌─────────────────┐
│  API Gateway    │ (Port 8080)
│  (FastAPI)      │
└──────┬──────────┘
       │
       ├──────────────┐
       ▼              ▼
┌─────────────┐  ┌─────────────┐
│ Restaurants │  │    Users    │
│  Service    │  │   Service   │
│ (Port 8000) │  │ (Port 8001) │
└─────────────┘  └─────────────┘
       │              │
       └──────┬───────┘
              ▼
    ┌─────────────────┐
    │  PostgreSQL     │
    │  RabbitMQ       │
    └─────────────────┘
```

## Services

### API Gateway (`api-gateway/`)
- Single entry point for all client requests
- Routes requests to appropriate microservices
- Handles CORS, logging, and error handling
- Port: 8080

### Restaurants Service (`services/restaurants/`)
- Minimal test service for restaurants
- In-memory storage (for testing)
- Port: 8000

### Users Service (`services/users/`)
- Minimal test service for users
- In-memory storage (for testing)
- Port: 8001

### Infrastructure
- **PostgreSQL**: Database (Port 5432)
- **RabbitMQ**: Message queue (Port 5672, Management UI: 15672)

## Quick Start

### Prerequisites
- Docker and Docker Compose installed
- Make sure ports 5432, 5672, 15672, 8000, 8001, 8080 are available

### Running the Services

1. **Start all services:**
   ```bash
   cd backend
   docker compose up --build
   ```

2. **Start in detached mode:**
   ```bash
   docker compose up -d --build
   ```

3. **View logs:**
   ```bash
   docker compose logs -f
   ```

4. **Stop services:**
   ```bash
   docker compose down
   ```

5. **Stop and remove volumes:**
   ```bash
   docker compose down -v
   ```

## Testing the Services

### API Gateway
```bash
# Health check
curl http://localhost:8080/health

# Root endpoint
curl http://localhost:8080/
```

### Restaurants Service (via Gateway)
```bash
# Get all restaurants
curl http://localhost:8080/api/restaurants/restaurants

# Get specific restaurant
curl http://localhost:8080/api/restaurants/restaurants/1

# Create restaurant
curl -X POST http://localhost:8080/api/restaurants/restaurants \
  -H "Content-Type: application/json" \
  -d '{"name": "Test Restaurant", "city": "Test City", "cuisine": "Test"}'
```

### Users Service (via Gateway)
```bash
# Get all users
curl http://localhost:8080/api/users/users

# Get specific user
curl http://localhost:8080/api/users/users/1

# Create user
curl -X POST http://localhost:8080/api/users/users \
  -H "Content-Type: application/json" \
  -d '{"name": "Test User", "email": "test@example.com", "role": "customer"}'
```

### Direct Service Access (for debugging)
```bash
# Restaurants service directly
curl http://localhost:8000/restaurants

# Users service directly
curl http://localhost:8001/users
```

## Service URLs

- **API Gateway**: http://localhost:8080
- **Restaurants Service**: http://localhost:8000
- **Users Service**: http://localhost:8001
- **RabbitMQ Management**: http://localhost:15672 (guest/guest)
- **PostgreSQL**: localhost:5432 (bitz_user/bitz_password)

## Development

### Project Structure
```
backend/
├── api-gateway/          # API Gateway service
├── services/
│   ├── restaurants/      # Restaurants microservice
│   └── users/            # Users microservice
├── shared/               # Shared utilities
│   ├── database.py       # Database utilities
│   ├── messaging.py      # RabbitMQ utilities
│   ├── logging.py        # Logging configuration
│   └── exceptions.py    # Common exceptions
└── docker-compose.yml    # Local development setup
```

### Adding a New Service

1. Create service directory: `services/new-service/`
2. Create minimal FastAPI app in `app/main.py`
3. Add Dockerfile
4. Add service to `docker-compose.yml`
5. Add proxy route in `api-gateway/app/routes/proxy.py`

## Next Steps

- [ ] Add database models and migrations
- [ ] Implement RabbitMQ event publishing
- [ ] Add authentication/authorization
- [ ] Set up Kubernetes manifests
- [ ] Add monitoring and logging
- [ ] Implement full CRUD operations

## Notes

- Services use in-memory storage for testing
- Database and RabbitMQ are ready but not yet integrated
- All services include health check endpoints
- Services communicate via Docker network
