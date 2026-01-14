from pydantic_settings import BaseSettings
from pydantic import Field


class Settings(BaseSettings):
    """Auth service settings."""


    database_url: str = Field(..., env="DATABASE_URL")
    jwt_algorithm: str = Field(..., env="JWT_ALGORITHM")
    jwt_secret: str = Field(..., env="JWT_SECRET")
    jwt_refresh_secret: str = Field(..., env="JWT_REFRESH_SECRET")
    jwt_refresh_expires_in: int = Field(..., env="JWT_REFRESH_EXPIRES_IN")
    jwt_access_token_expires_in: int = Field(..., env="JWT_ACCESS_TOKEN_EXPIRES_IN")

    