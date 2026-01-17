from typing import Optional
from pydantic_settings import BaseSettings
from pydantic import Field, field_validator


class Settings(BaseSettings):
    app_name: str = "Bitez Authentication Service"
    app_version: str = "1.0.0"
    debug: bool = Field(default=False, env="DEBUG")
    environment: str = Field(default="development", env="ENVIRONMENT")
    host: str = Field(default="0.0.0.0", env="HOST")
    port: int = Field(default=8002, env="PORT")
    
    database_url: str = Field(
        default="postgresql://bitz_user:bitz_password@localhost:5432/bitz_db",
        env="DATABASE_URL"
    )
    
    jwt_secret: str = Field(
        default="change-me-in-production-secret-key-min-32-chars",
        env="JWT_SECRET",
        min_length=32
    )
    jwt_algorithm: str = Field(default="HS256", env="JWT_ALGORITHM")
    jwt_access_token_expires_in: int = Field(default=3600, env="JWT_ACCESS_TOKEN_EXPIRES_IN", gt=0)
    
    jwt_refresh_secret: str = Field(
        default="change-me-in-production-refresh-secret-key-min-32-chars",
        env="JWT_REFRESH_SECRET",
        min_length=32
    )
    jwt_refresh_token_expires_in: int = Field(default=604800, env="JWT_REFRESH_TOKEN_EXPIRES_IN", gt=0)
    
    password_min_length: int = Field(default=8, ge=8, le=128)
    password_require_uppercase: bool = Field(default=True)
    password_require_lowercase: bool = Field(default=True)
    password_require_digits: bool = Field(default=True)
    password_require_special: bool = Field(default=False)
    bcrypt_rounds: int = Field(default=12, ge=10, le=15)
    
    @field_validator("jwt_algorithm")
    @classmethod
    def validate_jwt_algorithm(cls, v: str) -> str:
        allowed_algorithms = ["HS256", "HS384", "HS512"]
        if v not in allowed_algorithms:
            raise ValueError(f"JWT algorithm must be one of {allowed_algorithms}")
        return v
    
    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        case_sensitive = False


settings = Settings()
