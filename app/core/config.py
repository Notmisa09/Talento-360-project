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

    # URL publica del frontend, usada para construir el link de "olvide mi contrasena"
    FRONTEND_URL: str = "http://localhost:5173"
    RESET_TOKEN_EXPIRE_MINUTES: int = 30

    # SMTP - envio del correo de recuperacion de contrasena. Por defecto Gmail;
    # con SMTP_USER/SMTP_PASSWORD vacios, el correo se imprime en consola en vez de enviarse.
    SMTP_HOST: str = "smtp.gmail.com"
    SMTP_PORT: int = 587
    SMTP_USER: str = ""
    SMTP_PASSWORD: str = ""
    SMTP_FROM: str = "Talento360-HR <no-reply@talento360.com>"

    # Directorio local donde se guardan archivos subidos (documentos de expediente, CVs, etc.)
    STORAGE_DIR: str = "storage"


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
