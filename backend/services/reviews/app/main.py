from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from shared.logging import setup_logging, get_logger
from shared.database import init_database, get_database
from shared.exceptions import BitezException
from app.config import settings
from app.routes import reviews

logger = setup_logging(
    service_name="reviews-service",
    log_level="DEBUG" if settings.debug else "INFO",
    json_format=settings.environment != "development"
)


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Reviews service starting up", extra={"version": settings.app_version, "environment": settings.environment})
    try:
        init_database(
            settings.database_url,
            pool_size=10,
            max_overflow=20,
            pool_pre_ping=True,
            echo=settings.debug
        )
        db = get_database()
        if not db.health_check():
            logger.error("Database health check failed")
            raise RuntimeError("Database connection failed")
        logger.info("Database connection established")
    except Exception as e:
        logger.error("Failed to initialize", extra={"error": str(e)})
        raise
    yield
    logger.info("Reviews service shutting down")


app = FastAPI(
    title=settings.app_name,
    version=settings.app_version,
    debug=settings.debug,
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/openapi.json",
    servers=[{"url": "http://localhost:8080/api/reviews", "description": "API Gateway"}]
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.exception_handler(BitezException)
async def bitz_exception_handler(request, exc: BitezException):
    logger.error("Bitez exception", extra={"message": exc.message, "status_code": exc.status_code, "details": exc.details})
    return JSONResponse(status_code=exc.status_code, content={"error": exc.message, "details": exc.details})


@app.exception_handler(Exception)
async def general_exception_handler(request, exc: Exception):
    logger.error("Unhandled exception", extra={"error": str(exc), "type": type(exc).__name__})
    return JSONResponse(
        status_code=500,
        content={"error": "Internal server error", "message": str(exc) if settings.debug else "An unexpected error occurred"}
    )


app.include_router(reviews.router)


@app.get("/")
async def root():
    return {"service": settings.app_name, "version": settings.app_version, "status": "running", "environment": settings.environment}


@app.get("/health")
async def health():
    db = get_database()
    ok = db.health_check()
    return {"status": "healthy" if ok else "unhealthy", "service": "reviews", "database": "connected" if ok else "disconnected"}


@app.get("/health/ready")
async def readiness():
    db = get_database()
    if not db.health_check():
        return JSONResponse(status_code=503, content={"status": "not ready", "service": "reviews", "database": "not connected"})
    return {"status": "ready", "service": "reviews"}


@app.get("/health/live")
async def liveness():
    return {"status": "alive", "service": "reviews"}
