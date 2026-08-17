from datetime import datetime, timedelta, timezone
from typing import Any
from uuid import UUID

import bcrypt
from fastapi import Depends
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.database import get_db
from app.core.exceptions import AppException

oauth2_scheme = OAuth2PasswordBearer(tokenUrl=f"{settings.API_V1_PREFIX}/auth/login")

TOKEN_TYPE_ACCESS = "access"
TOKEN_TYPE_REFRESH = "refresh"

# bcrypt trunca/rechaza secretos de mas de 72 bytes; los schemas Pydantic ya
# limitan la contrasena a ese largo, esto es solo una salvaguarda defensiva.
_BCRYPT_MAX_BYTES = 72


def hash_password(password: str) -> str:
    password_bytes = password.encode("utf-8")[:_BCRYPT_MAX_BYTES]
    return bcrypt.hashpw(password_bytes, bcrypt.gensalt()).decode("utf-8")


def verify_password(plain_password: str, password_hash: str) -> bool:
    password_bytes = plain_password.encode("utf-8")[:_BCRYPT_MAX_BYTES]
    try:
        return bcrypt.checkpw(password_bytes, password_hash.encode("utf-8"))
    except ValueError:
        return False


def _create_token(subject: str, rol: str, expires_delta: timedelta, token_type: str) -> str:
    now = datetime.now(timezone.utc)
    payload: dict[str, Any] = {
        "sub": subject,
        "rol": rol,
        "type": token_type,
        "iat": now,
        "exp": now + expires_delta,
    }
    return jwt.encode(payload, settings.SECRET_KEY, algorithm=settings.ALGORITHM)


def create_access_token(usuario_id: UUID, rol: str) -> str:
    return _create_token(
        str(usuario_id), rol, timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES), TOKEN_TYPE_ACCESS
    )


def create_refresh_token(usuario_id: UUID, rol: str) -> str:
    return _create_token(
        str(usuario_id), rol, timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS), TOKEN_TYPE_REFRESH
    )


class TokenInvalidoError(AppException):
    status_code = 401
    code = "TOKEN_INVALIDO"

    def __init__(self, detail: str = "Token invalido o expirado") -> None:
        super().__init__(detail)


def decode_token(token: str, expected_type: str) -> dict[str, Any]:
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
    except JWTError as exc:
        raise TokenInvalidoError() from exc

    if payload.get("type") != expected_type:
        raise TokenInvalidoError(f"Se esperaba un token de tipo '{expected_type}'")

    return payload


def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    # Import local para evitar import circular (repository -> models -> shared, sin depender de security)
    from app.modules.auth.repository import UsuarioRepository

    payload = decode_token(token, TOKEN_TYPE_ACCESS)

    try:
        usuario_id = UUID(payload["sub"])
    except (KeyError, ValueError) as exc:
        raise TokenInvalidoError() from exc

    usuario = UsuarioRepository(db).get_by_id(usuario_id)
    if usuario is None:
        raise TokenInvalidoError("El usuario asociado al token ya no existe")
    if not usuario.activo:
        raise AppException("El usuario esta inactivo", code="USUARIO_INACTIVO", status_code=403)

    return usuario


def require_role(*roles: str):
    """Dependencia RBAC: restringe un endpoint a los roles indicados."""

    def dependency(current_user=Depends(get_current_user)):
        if current_user.rol.value not in roles:
            raise AppException(
                "No tiene permisos suficientes para realizar esta accion",
                code="PERMISO_DENEGADO",
                status_code=403,
            )
        return current_user

    return dependency
