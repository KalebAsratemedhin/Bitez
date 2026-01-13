"""Users service main application - Minimal test service."""

from fastapi import FastAPI
from shared.logging import setup_logging
from app.config import settings

# Setup logging
logger = setup_logging(
    service_name="users-service",
    log_level="DEBUG" if settings.debug else "INFO",
    json_format=settings.environment != "development"
)

# Create FastAPI app
app = FastAPI(
    title=settings.app_name,
    version=settings.app_version,
    debug=settings.debug
)

# Simple in-memory storage for testing
users = [
    {"id": 1, "name": "John Doe", "email": "john@example.com", "role": "customer"},
    {"id": 2, "name": "Jane Smith", "email": "jane@example.com", "role": "customer"},
    {"id": 3, "name": "Admin User", "email": "admin@example.com", "role": "admin"}
]


@app.get("/")
async def root():
    """Root endpoint."""
    return {
        "service": settings.app_name,
        "version": settings.app_version,
        "status": "running",
        "environment": settings.environment
    }


@app.get("/health")
async def health():
    """Health check endpoint."""
    return {"status": "healthy", "service": "users"}


@app.get("/health/ready")
async def readiness():
    """Readiness check endpoint."""
    return {"status": "ready", "service": "users"}


@app.get("/health/live")
async def liveness():
    """Liveness check endpoint."""
    return {"status": "alive", "service": "users"}


@app.get("/users")
async def get_users():
    """Get all users."""
    logger.info("Getting all users", extra={"count": len(users)})
    return {"users": users, "count": len(users)}


@app.get("/users/{user_id}")
async def get_user(user_id: int):
    """Get a user by ID."""
    user = next((u for u in users if u["id"] == user_id), None)
    if not user:
        return {"error": "User not found"}, 404
    logger.info("Getting user", extra={"user_id": user_id})
    return user


@app.post("/users")
async def create_user(user: dict):
    """Create a new user."""
    new_id = max([u["id"] for u in users], default=0) + 1
    user["id"] = new_id
    users.append(user)
    logger.info("User created", extra={"user_id": new_id})
    return user
