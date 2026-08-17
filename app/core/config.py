from functools import lru_cache
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Configuracion centralizada de la aplicacion (variables de entorno / .env)."""

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    PROJECT_NAME: str = "Talento360-HR"
    API_V1_PREFIX: str = "/api/v1"

    # Base de datos. En produccion: "mssql+pyodbc://user:pass@host/db?driver=ODBC+Driver+18+for+SQL+Server"
    # Por defecto usa SQLite local para desarrollo/pruebas sin depender de una instancia de SQL Server.
    DATABASE_URL: str = "sqlite:///./hrm_dev.db"

    # JWT
    SECRET_KEY: str = "CHANGE_ME_INSECURE_DEV_SECRET_KEY"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7

    # CORS - origenes permitidos para el frontend (Vite dev server por defecto)
    CORS_ORIGINS: list[str] = ["http://localhost:5173", "http://127.0.0.1:5173"]


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
