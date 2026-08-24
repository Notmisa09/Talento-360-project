import math
from uuid import UUID

from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.email import send_email
from app.core.security import (
    TOKEN_TYPE_REFRESH,
    TOKEN_TYPE_RESET,
    create_access_token,
    create_password_reset_token,
    create_refresh_token,
    decode_token,
    hash_password,
    password_fingerprint,
    verify_password,
)
from app.core.security import TokenInvalidoError
from app.modules.auth.emails import build_reset_password_email
from app.modules.auth.exceptions import (
    CredencialesInvalidasError,
    EmailYaRegistradoError,
    PasswordActualIncorrectaError,
    UsuarioNoEncontradoError,
)
from app.modules.auth.models import Usuario
from app.modules.auth.repository import UsuarioRepository
from app.modules.auth.schemas import Token, UsuarioCreate, UsuarioUpdate


class AuthService:
    def __init__(self, db: Session) -> None:
        self.repo = UsuarioRepository(db)

    def _issue_tokens(self, usuario: Usuario) -> Token:
        return Token(
            access_token=create_access_token(usuario.id, usuario.rol.value),
            refresh_token=create_refresh_token(usuario.id, usuario.rol.value),
        )

    def login(self, email: str, password: str) -> Token:
        usuario = self.repo.get_by_email(email)
        if usuario is None or not verify_password(password, usuario.password_hash):
            raise CredencialesInvalidasError()
        if not usuario.activo:
            raise CredencialesInvalidasError()
        return self._issue_tokens(usuario)

    def refresh(self, refresh_token: str) -> Token:
        payload = decode_token(refresh_token, TOKEN_TYPE_REFRESH)
        usuario = self.repo.get_by_id(UUID(payload["sub"]))
        if usuario is None or not usuario.activo:
            raise CredencialesInvalidasError()
        return self._issue_tokens(usuario)

    def forgot_password(self, email: str) -> None:
        # Siempre responde igual exista o no el usuario, para no filtrar que emails estan registrados.
        usuario = self.repo.get_by_email(email)
        if usuario is None or not usuario.activo:
            return

        token = create_password_reset_token(usuario.id, usuario.password_hash)
        reset_url = f"{settings.FRONTEND_URL}/reset-password?token={token}"
        html, text = build_reset_password_email(usuario.email, reset_url, settings.RESET_TOKEN_EXPIRE_MINUTES)
        send_email(usuario.email, "Restablecer tu contrasena - Talento360-HR", html, text)

    def reset_password(self, token: str, password_nuevo: str) -> None:
        payload = decode_token(token, TOKEN_TYPE_RESET)

        try:
            usuario_id = UUID(payload["sub"])
        except (KeyError, ValueError) as exc:
            raise TokenInvalidoError() from exc

        usuario = self.repo.get_by_id(usuario_id)
        if usuario is None or not usuario.activo:
            raise TokenInvalidoError()

        if payload.get("pwdfp") != password_fingerprint(usuario.password_hash):
            raise TokenInvalidoError("El enlace ya fue utilizado o ya no es valido")

        usuario.password_hash = hash_password(password_nuevo)
        self.repo.save(usuario)


class UsuarioService:
    def __init__(self, db: Session) -> None:
        self.repo = UsuarioRepository(db)

    def crear_usuario(self, data: UsuarioCreate) -> Usuario:
        if self.repo.get_by_email(data.email) is not None:
            raise EmailYaRegistradoError()
        usuario = Usuario(email=data.email, password_hash=hash_password(data.password), rol=data.rol)
        return self.repo.create(usuario)

    def listar_usuarios(self, page: int, size: int) -> tuple[list[Usuario], int, int]:
        items, total = self.repo.list(page, size)
        pages = math.ceil(total / size) if total else 0
        return items, total, pages

    def obtener_usuario(self, usuario_id: UUID) -> Usuario:
        usuario = self.repo.get_by_id(usuario_id)
        if usuario is None:
            raise UsuarioNoEncontradoError()
        return usuario

    def actualizar_usuario(self, usuario_id: UUID, data: UsuarioUpdate) -> Usuario:
        usuario = self.obtener_usuario(usuario_id)
        if data.rol is not None:
            usuario.rol = data.rol
        if data.activo is not None:
            usuario.activo = data.activo
        return self.repo.save(usuario)

    def cambiar_password(self, usuario: Usuario, password_actual: str, password_nuevo: str) -> None:
        if not verify_password(password_actual, usuario.password_hash):
            raise PasswordActualIncorrectaError()
        usuario.password_hash = hash_password(password_nuevo)
        self.repo.save(usuario)

    def desactivar_usuario(self, usuario_id: UUID) -> Usuario:
        usuario = self.obtener_usuario(usuario_id)
        usuario.activo = False
        return self.repo.save(usuario)
