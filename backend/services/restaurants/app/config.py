from pydantic_settings import BaseSettings
from pydantic import Field, field_validator


class Settings(BaseSettings):
    app_name: str = "Bitez Restaurants Service"
    app_version: str = "1.0.0"
    debug: bool = Field(default=False, env="DEBUG")
    environment: str = Field(default="development", env="ENVIRONMENT")
    host: str = Field(default="0.0.0.0", env="RESTAURANTS_HOST")
    port: int = Field(default=8004, env="RESTAURANTS_PORT")
    database_url: str = Field(
        default="postgresql://bitz_user:bitz_password@localhost:5432/bitz_db",
        env="DATABASE_URL"
    )
    jwt_secret: str = Field(
        default="change-me-in-production-secret-key-min-32-chars",
        env="JWT_SECRET"
    )
    jwt_algorithm: str = Field(default="HS256", env="JWT_ALGORITHM")

    @field_validator("jwt_secret")
    @classmethod
    def validate_jwt_secret(cls, v: str) -> str:
        if len(v) < 32:
            raise ValueError("JWT secret must be at least 32 characters long")
        return v

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        case_sensitive = False


settings = Settings()
