"""Auth service main application"""

from fastapi import FastAPI
from shared.logging import setup_logging
from app.config import settings

# Setup logging
logger = setup_logging(
    service_name="auth-service",
    log_level="DEBUG" if settings.debug else "INFO",
    json_format=settings.environment != "development"
)

# Create FastAPI app
app = FastAPI(
    title=settings.app_name,
    version=settings.app_version,
    debug=settings.debug
)


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
    return {"status": "healthy", "service": "auth"}


@app.get("/health/ready")
async def readiness():
    """Readiness check endpoint."""
    return {"status": "ready", "service": "auth"}


@app.get("/health/live")
async def liveness():
    """Liveness check endpoint."""
    return {"status": "alive", "service": "auth"}

