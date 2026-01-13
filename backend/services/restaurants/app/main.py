"""Restaurants service main application - Minimal test service."""

from fastapi import FastAPI
from shared.logging import setup_logging
from app.config import settings

# Setup logging
logger = setup_logging(
    service_name="restaurants-service",
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
restaurants = [
    {"id": 1, "name": "Pizza Palace", "city": "New York", "cuisine": "Italian"},
    {"id": 2, "name": "Burger House", "city": "Los Angeles", "cuisine": "American"},
    {"id": 3, "name": "Sushi World", "city": "San Francisco", "cuisine": "Japanese"}
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
    return {"status": "healthy", "service": "restaurants"}


@app.get("/health/ready")
async def readiness():
    """Readiness check endpoint."""
    return {"status": "ready", "service": "restaurants"}


@app.get("/health/live")
async def liveness():
    """Liveness check endpoint."""
    return {"status": "alive", "service": "restaurants"}


@app.get("/restaurants")
async def get_restaurants():
    """Get all restaurants."""
    logger.info("Getting all restaurants", extra={"count": len(restaurants)})
    return {"restaurants": restaurants, "count": len(restaurants)}


@app.get("/restaurants/{restaurant_id}")
async def get_restaurant(restaurant_id: int):
    """Get a restaurant by ID."""
    restaurant = next((r for r in restaurants if r["id"] == restaurant_id), None)
    if not restaurant:
        return {"error": "Restaurant not found"}, 404
    logger.info("Getting restaurant", extra={"restaurant_id": restaurant_id})
    return restaurant


@app.post("/restaurants")
async def create_restaurant(restaurant: dict):
    """Create a new restaurant."""
    new_id = max([r["id"] for r in restaurants], default=0) + 1
    restaurant["id"] = new_id
    restaurants.append(restaurant)
    logger.info("Restaurant created", extra={"restaurant_id": new_id})
    return restaurant
