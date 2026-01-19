from typing import Optional
from fastapi import APIRouter, Request, HTTPException, status, Depends
from fastapi.responses import Response
from fastapi.security import HTTPBearer
import httpx
import json

from shared.logging import get_logger
from app.config import settings
from app.schemas.auth import (
    UserRegister,
    UserLogin,
    TokenRefresh,
    TokenResponse,
    TokenValidationResponse
)
from app.schemas.user import UserResponse

logger = get_logger("api-gateway")
router = APIRouter(prefix="/auth", tags=["authentication"])

client: Optional[httpx.AsyncClient] = None
security = HTTPBearer()


def init_client():
    global client
    client = httpx.AsyncClient(timeout=settings.request_timeout)
    logger.info("HTTP client initialized for proxying")


async def close_client():
    global client
    if client:
        await client.aclose()
        client = None
        logger.info("HTTP client closed")


async def _proxy_request(method: str, path: str, request: Request, body: Optional[bytes] = None):
    global client
    
    if client is None:
        raise HTTPException(status_code=503, detail="Service client not initialized")
    
    target_url = f"{settings.auth_service_url}/auth/{path}"
    
    try:
        query_params = dict(request.query_params)
        
        headers = dict(request.headers)
        headers.pop("host", None)
        headers.pop("connection", None)
        headers.pop("content-length", None)
        
        logger.debug("Proxying request", extra={
            "method": method,
            "target_url": target_url,
            "path": path
        })
        
        response = await client.request(
            method=method,
            url=target_url,
            params=query_params,
            content=body,
            headers=headers
        )
        
        return Response(
            content=response.content,
            status_code=response.status_code,
            headers=dict(response.headers),
            media_type=response.headers.get("content-type")
        )
        
    except httpx.TimeoutException:
        logger.error("Request timeout", extra={"method": method, "path": path, "target_url": target_url})
        raise HTTPException(status_code=504, detail="Service timeout")
    except httpx.ConnectError:
        logger.error("Connection error", extra={"method": method, "path": path, "target_url": target_url})
        raise HTTPException(status_code=503, detail="Service unavailable")
    except Exception as e:
        logger.error("Proxy error", extra={"error": str(e), "method": method, "path": path, "target_url": target_url})
        raise HTTPException(status_code=500, detail="Internal server error")


@router.post("/register", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
async def register(user_data: UserRegister, request: Request):
    body = json.dumps(user_data.model_dump()).encode()
    return await _proxy_request("POST", "register", request, body)


@router.post("/login", response_model=TokenResponse, status_code=status.HTTP_200_OK)
async def login(login_data: UserLogin, request: Request):
    body = json.dumps(login_data.model_dump()).encode()
    return await _proxy_request("POST", "login", request, body)


@router.post("/refresh", response_model=dict, status_code=status.HTTP_200_OK)
async def refresh_token(token_data: TokenRefresh, request: Request):
    body = json.dumps(token_data.model_dump()).encode()
    return await _proxy_request("POST", "refresh", request, body)


@router.post("/logout", status_code=status.HTTP_200_OK)
async def logout(token_data: TokenRefresh, request: Request):
    body = json.dumps(token_data.model_dump()).encode()
    return await _proxy_request("POST", "logout", request, body)


@router.get(
    "/validate",
    response_model=TokenValidationResponse,
    status_code=status.HTTP_200_OK,
    dependencies=[Depends(security)]
)
async def validate_token(request: Request):
    return await _proxy_request("GET", "validate", request)


@router.get(
    "/me",
    response_model=UserResponse,
    status_code=status.HTTP_200_OK,
    dependencies=[Depends(security)]
)
async def get_current_user_info(request: Request):
    return await _proxy_request("GET", "me", request)
