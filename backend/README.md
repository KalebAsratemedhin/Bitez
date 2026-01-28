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
│  (Nginx)        │
└──────┬──────────┘
       │
       ├──────────────┐
       ▼              ▼
┌─────────────┐  ┌─────────────┐
│    Auth     │  │    Users    │
│  Service    │  │   Service   │
│ (Port 8002) │  │ (Port 8003) │
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

### API Gateway (`nginx/`)
- Single entry point for all client requests
- Nginx reverse proxy routing requests to microservices
- Handles CORS, load balancing, and request proxying
- Port: 8080
- Swagger docs available through gateway: `/api/auth/docs`, `/api/users/docs`

### Auth Service (`services/auth/`)
- User authentication and authorization
- JWT token management (access & refresh tokens)
- User registration and login
- Port: 8002
- Direct Swagger docs: `http://localhost:8002/docs`

### Users Service (`services/users/`)
- User profile management
- Profile CRUD operations
- Port: 8003
- Direct Swagger docs: `http://localhost:8003/docs`

### Infrastructure
- **PostgreSQL**: Database (Port 5432)
- **RabbitMQ**: Message queue (Port 5672, Management UI: 15672)

## Quick Start

### Prerequisites
- Docker and Docker Compose installed
- Make sure ports 5432, 5672, 15672, 8002, 8003, 8080 are available

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

### Auth Service (via Gateway)
```bash
# Register a new user
curl -X POST http://localhost:8080/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email": "user@example.com", "password": "SecurePass123!", "password_confirm": "SecurePass123!"}'

# Login
curl -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "user@example.com", "password": "SecurePass123!"}'

# Get current user info (requires Bearer token)
curl http://localhost:8080/api/auth/me \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

### Users Service (via Gateway)
```bash
# Get user profile (requires Bearer token)
curl http://localhost:8080/api/users/profiles/me \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"

# Create user profile (requires Bearer token)
curl -X POST http://localhost:8080/api/users/profiles \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"first_name": "John", "last_name": "Doe", "phone_number": "+1234567890"}'
```

### Swagger Documentation

Each service has its own Swagger documentation:

- **Auth Service Docs (via Gateway)**: http://localhost:8080/api/auth/docs
- **Auth Service Docs (Direct)**: http://localhost:8002/docs
- **Users Service Docs (via Gateway)**: http://localhost:8080/api/users/docs
- **Users Service Docs (Direct)**: http://localhost:8003/docs

## Service URLs

- **API Gateway (Nginx)**: http://localhost:8080
- **Auth Service**: http://localhost:8002
- **Users Service**: http://localhost:8003
- **RabbitMQ Management**: http://localhost:15672 (guest/guest)
- **PostgreSQL**: localhost:5432 (bitz_user/bitz_password)

## Development

### Project Structure
```
backend/
├── nginx/                # Nginx API Gateway configuration
│   ├── nginx.conf        # Nginx configuration
│   └── Dockerfile        # Nginx Dockerfile
├── services/
│   ├── auth/             # Authentication microservice
│   └── users/            # Users/Profiles microservice
├── shared/               # Shared utilities
│   ├── database.py       # Database utilities
│   ├── messaging.py      # RabbitMQ utilities
│   ├── logging.py        # Logging configuration
│   └── exceptions.py     # Common exceptions
└── docker-compose.yml    # Local development setup
```

### Adding a New Service

1. Create service directory: `services/new-service/`
2. Create FastAPI app in `app/main.py` with Swagger docs enabled
3. Add Dockerfile
4. Add service to `docker-compose.yml`
5. Add upstream and location blocks in `nginx/nginx.conf`

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
