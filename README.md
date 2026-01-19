# Bitez - Dining & Delivery Ecosystem

A full-stack food delivery platform connecting restaurants with customers through a modern, scalable microservices architecture.

## Core Concept

Bitez is a comprehensive dining and delivery ecosystem that creates a seamless connection between restaurants and customers. The platform enables real-time food ordering, delivery tracking, and personalized experiences powered by mood-based recommendations and intelligent user experience features.

## Tech Stack

- **Backend**: FastAPI (Python)
- **Frontend**: Next.js (React/TypeScript)
- **Architecture**: Microservices with message queues
- **Orchestration**: Kubernetes
- **Real-time**: WebSocket support for live tracking

## Key Features

### Core Functionality
- **Restaurant Management**: Restaurant registration, menu management, and order processing
- **Customer Experience**: Browse restaurants, place orders, and manage account
- **Real-time Delivery Tracking**: Live GPS tracking of delivery orders with real-time updates
- **Order Management**: Complete order lifecycle from placement to delivery

### Advanced Features
- **Mood-based Recommendations**: AI-powered food suggestions based on user mood and preferences
- **Personalized User Experience**: Customized recommendations, order history, and preferences
- **Real-time Notifications**: Push notifications for order status updates
- **Multi-restaurant Support**: Browse and order from multiple restaurants

## Architecture

The application follows a microservices architecture pattern:
- Independent, scalable services for different domains (restaurants, orders, delivery, recommendations, etc.)
- Message queue-based communication between services
- Kubernetes orchestration for containerized deployment
- API Gateway for unified frontend communication

## Quick Start

### Prerequisites

- Docker and Docker Compose installed
- Ports available: 5432, 5672, 15672, 8002, 8080

### Starting the Services

```bash
# Navigate to backend directory
cd backend

# Start all services (builds images if needed)
docker compose up --build

# Or start in detached mode (runs in background)
docker compose up -d --build
```

### Verifying Services

```bash
# Check service status
docker compose ps

# View logs
docker compose logs -f

# View logs for specific service
docker compose logs -f auth
docker compose logs -f api-gateway
docker compose logs -f postgres
```

### Stopping Services

```bash
# Stop services (keeps containers)
docker compose stop

# Stop and remove containers
docker compose down

# Stop and remove containers + volumes (deletes database data)
docker compose down -v
```

## Service URLs

- **API Gateway**: http://localhost:8080
- **Auth Service**: http://localhost:8002
- **PostgreSQL**: localhost:5432 (user: `bitz_user`, password: `bitz_password`, database: `bitz_db`)
- **RabbitMQ Management UI**: http://localhost:15672 (user: `guest`, password: `guest`)

## Testing the Services

### Health Checks

```bash
# API Gateway health
curl http://localhost:8080/health

# Auth service health (direct)
curl http://localhost:8002/health

# Auth service health (via gateway)
curl http://localhost:8080/api/auth/health
```

### Authentication Endpoints

```bash
# Register a new user
curl -X POST http://localhost:8080/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "SecurePass123",
    "password_confirm": "SecurePass123"
  }'

# Login
curl -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "SecurePass123"
  }'

# Get current user (requires access token from login/register)
curl http://localhost:8080/api/auth/me \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

## Database Migrations

### Creating a New Migration

```bash
# 1. Update your SQLAlchemy models in app/models/
# 2. Generate migration using autogenerate
docker compose run --rm \
  -e DATABASE_URL="postgresql://bitz_user:bitz_password@postgres:5432/bitz_db" \
  -v "$(pwd)/services/auth/alembic:/app/alembic" \
  auth \
  alembic revision --autogenerate -m "Description of changes"

# 3. Review the generated migration file
# 4. Commit to version control
```

### Applying Migrations

Migrations run automatically on container startup. For manual application:

```bash
# Apply all pending migrations
docker compose run --rm \
  -e DATABASE_URL="postgresql://bitz_user:bitz_password@postgres:5432/bitz_db" \
  auth \
  alembic upgrade head

# Rollback one migration
docker compose run --rm \
  -e DATABASE_URL="postgresql://bitz_user:bitz_password@postgres:5432/bitz_db" \
  auth \
  alembic downgrade -1

# Check current migration status
docker compose run --rm \
  -e DATABASE_URL="postgresql://bitz_user:bitz_password@postgres:5432/bitz_db" \
  auth \
  alembic current
```

### Viewing Database

```bash
# Connect to PostgreSQL
docker compose exec postgres psql -U bitz_user -d bitz_db

# List tables
docker compose exec postgres psql -U bitz_user -d bitz_db -c "\dt"

# View users table
docker compose exec postgres psql -U bitz_user -d bitz_db -c "SELECT * FROM users;"
```

## Development Workflow

### Rebuilding Services

```bash
# Rebuild specific service
docker compose build auth

# Rebuild all services
docker compose build

# Rebuild and restart
docker compose up --build auth
```

### Viewing Service Logs

```bash
# All services
docker compose logs -f

# Specific service
docker compose logs -f auth
docker compose logs -f api-gateway
docker compose logs -f postgres

# Last 100 lines
docker compose logs --tail=100 auth

# Since specific time
docker compose logs --since 10m auth
```

### Accessing Service Shells

```bash
# Access auth service container
docker compose exec auth sh

# Access database container
docker compose exec postgres sh
```

### Restarting Services

```bash
# Restart specific service
docker compose restart auth

# Restart all services
docker compose restart
```

## Troubleshooting

### Services Won't Start

```bash
# Check if ports are in use
netstat -tulpn | grep -E '5432|5672|8002|8080'

# Check Docker logs
docker compose logs

# Verify Docker is running
docker ps
```

### Database Connection Issues

```bash
# Check if PostgreSQL is running
docker compose ps postgres

# Check PostgreSQL logs
docker compose logs postgres

# Test database connection
docker compose exec postgres psql -U bitz_user -d bitz_db -c "SELECT 1;"
```

### Migration Issues

```bash
# Check migration status
docker compose run --rm \
  -e DATABASE_URL="postgresql://bitz_user:bitz_password@postgres:5432/bitz_db" \
  auth \
  alembic current

# View migration history
docker compose run --rm \
  -e DATABASE_URL="postgresql://bitz_user:bitz_password@postgres:5432/bitz_db" \
  auth \
  alembic history
```

### Clean Slate

```bash
# Stop everything and remove all data
docker compose down -v

# Remove all images (careful - rebuilds will be needed)
docker compose down --rmi all

# Complete cleanup (containers, volumes, images, networks)
docker compose down -v --rmi all
```

## Development Approach

This project will be built iteratively:

1. **Phase 1**: Infrastructure setup and project scaffolding
   - Kubernetes cluster configuration
   - Message queue setup
   - Basic service templates
   - CI/CD pipeline foundation

2. **Phase 2+**: Feature rollout
   - Features will be implemented one by one
   - Each feature will be fully tested before moving to the next
   - Incremental deployment and validation

## Project Status

For detailed project status, implementation details, architectural decisions, and roadmap, see:
- **`backend/PROJECT_STATUS.md`**: Comprehensive project status and summary
- **`backend/AUTH_IMPLEMENTATION_GUIDE.md`**: Detailed auth service implementation guide
