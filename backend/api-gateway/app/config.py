from typing import List
from pydantic_settings import BaseSettings
from pydantic import Field, computed_field


class Settings(BaseSettings):
    """API Gateway settings."""
    
    # Application
    app_name: str = "Bitez API Gateway"
    app_version: str = "1.0.0"
    debug: bool = Field(default=False, env="DEBUG")
    environment: str = Field(default="development", env="ENVIRONMENT")
    
    # Server
    host: str = Field(default="0.0.0.0", env="HOST")
    port: int = Field(default=8000, env="PORT")
    
    # CORS - Store as string to avoid JSON parsing, convert to list via computed field
    cors_origins_str: str = Field(
        default="http://localhost:3000,http://localhost:3001",
        alias="CORS_ORIGINS",
        env="CORS_ORIGINS"
    )
    
    @computed_field
    @property
    def cors_origins(self) -> List[str]:
        """Parse CORS origins from comma-separated string."""
        if not self.cors_origins_str.strip():
            return ["http://localhost:3000", "http://localhost:3001"]
        return [
            origin.strip() 
            for origin in self.cors_origins_str.split(",") 
            if origin.strip()
        ]
    
    cors_allow_credentials: bool = True
    cors_allow_methods: List[str] = ["*"]
    cors_allow_headers: List[str] = ["*"]
    
    # Service Discovery
    auth_service_url: str = Field(
        default="http://auth:8002",
        env="AUTH_SERVICE_URL"
    )
    
    # Timeouts
    request_timeout: float = Field(default=30.0, env="REQUEST_TIMEOUT")
    
    class Config:
        # Docker Compose loads env vars from .env.api-gateway file
        # So we don't need to specify env_file here
        env_file_encoding = "utf-8"
        case_sensitive = False


# Global settings instance
settings = Settings()