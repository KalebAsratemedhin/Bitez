from fastapi import FastAPI, Request, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import httpx
import time
from contextlib import asynccontextmanager

from shared.logging import setup_logging, get_logger
from shared.exceptions import BitezException
from app.config import settings
from app.routes import health, proxy

# Setup logging
logger = setup_logging(
    service_name="api-gateway",
    log_level="DEBUG" if settings.debug else "INFO",
    json_format=settings.environment != "development"
)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan events."""
    # Startup
    logger.info("API Gateway starting up", extra={
        "version": settings.app_version,
        "environment": settings.environment
    })
    
    # Initialize httpx client for proxy
    from app.routes.proxy import init_client
    init_client()
    
    yield
    
    # Shutdown - close httpx client
    from app.routes.proxy import close_client
    await close_client()
    
    logger.info("API Gateway shutting down")


# Create FastAPI app
app = FastAPI(
    title=settings.app_name,
    version=settings.app_version,
    debug=settings.debug,
    lifespan=lifespan
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=settings.cors_allow_credentials,
    allow_methods=settings.cors_allow_methods,
    allow_headers=settings.cors_allow_headers,
)

# Request timing middleware
@app.middleware("http")
async def add_process_time_header(request: Request, call_next):
    """Add request processing time to response headers."""
    start_time = time.time()
    response = await call_next(request)
    process_time = time.time() - start_time
    response.headers["X-Process-Time"] = str(process_time)
    return response

# Logging middleware
@app.middleware("http")
async def log_requests(request: Request, call_next):
    """Log all incoming requests."""
    start_time = time.time()
    
    logger.info("Incoming request", extra={
        "method": request.method,
        "path": request.url.path,
        "client": request.client.host if request.client else None
    })
    
    response = await call_next(request)
    
    process_time = time.time() - start_time
    logger.info("Request completed", extra={
        "method": request.method,
        "path": request.url.path,
        "status_code": response.status_code,
        "process_time": process_time
    })
    
    return response

# Exception handlers
@app.exception_handler(BitezException)
async def bitz_exception_handler(request: Request, exc: BitezException):
    """Handle custom Bitez exceptions."""
    logger.error("Bitez exception", extra={
        "message": exc.message,
        "status_code": exc.status_code,
        "details": exc.details
    })
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "error": exc.message,
            "details": exc.details
        }
    )

@app.exception_handler(Exception)
async def general_exception_handler(request: Request, exc: Exception):
    """Handle general exceptions."""
    logger.error("Unhandled exception", extra={
        "error": str(exc),
        "type": type(exc).__name__
    })
    return JSONResponse(
        status_code=500,
        content={
            "error": "Internal server error",
            "message": str(exc) if settings.debug else "An unexpected error occurred"
        }
    )

# Include routers
app.include_router(health.router, prefix="/health", tags=["health"])
app.include_router(proxy.router, prefix="/api", tags=["api"])


@app.get("/")
async def root():
    """Root endpoint."""
    return {
        "service": settings.app_name,
        "version": settings.app_version,
        "status": "running",
        "environment": settings.environment
    }