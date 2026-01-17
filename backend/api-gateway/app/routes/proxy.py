from typing import Optional
from fastapi import APIRouter, Request, HTTPException
from fastapi.responses import Response
import httpx

from shared.logging import get_logger
from app.config import settings

logger = get_logger("api-gateway")
router = APIRouter()

client: Optional[httpx.AsyncClient] = None


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


@router.api_route("/auth/{path:path}", methods=["GET", "POST", "PUT", "DELETE", "PATCH"])
async def proxy_auth(request: Request, path: str):
    global client
    
    if client is None:
        raise HTTPException(status_code=503, detail="Service client not initialized")
    
    target_url = f"{settings.auth_service_url}/auth/{path}"
    
    try:
        query_params = dict(request.query_params)
        
        body = None
        if request.method in ["POST", "PUT", "PATCH"]:
            body = await request.body()
        
        headers = dict(request.headers)
        headers.pop("host", None)
        headers.pop("connection", None)
        headers.pop("content-length", None)
        
        logger.debug("Proxying request", extra={
            "method": request.method,
            "target_url": target_url,
            "path": path
        })
        
        response = await client.request(
            method=request.method,
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
        logger.error("Request timeout", extra={"method": request.method, "path": path, "target_url": target_url})
        raise HTTPException(status_code=504, detail="Service timeout")
    except httpx.ConnectError:
        logger.error("Connection error", extra={"method": request.method, "path": path, "target_url": target_url})
        raise HTTPException(status_code=503, detail="Service unavailable")
    except Exception as e:
        logger.error("Proxy error", extra={"error": str(e), "method": request.method, "path": path, "target_url": target_url})
        raise HTTPException(status_code=500, detail="Internal server error")
