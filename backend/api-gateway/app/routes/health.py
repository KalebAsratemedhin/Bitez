"""Health check routes."""

from fastapi import APIRouter

from shared.logging import get_logger

logger = get_logger("api-gateway")
router = APIRouter()


@router.get("/")
async def health_check():
    """Basic health check endpoint."""
    return {
        "status": "healthy",
        "service": "api-gateway"
    }


@router.get("/ready")
async def readiness_check():
    """Readiness check - verifies service can accept traffic."""
    return {
        "status": "ready",
        "service": "api-gateway"
    }


@router.get("/live")
async def liveness_check():
    """Liveness check - verifies service is alive."""
    return {
        "status": "alive",
        "service": "api-gateway"
    }