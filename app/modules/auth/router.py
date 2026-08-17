from uuid import UUID

from fastapi import APIRouter, Depends, Query, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import get_current_user, require_role
from app.modules.auth.models import RolEnum, Usuario
from app.modules.auth.schemas import (
    CambiarPasswordRequest,
    RefreshTokenRequest,
    Token,
    UsuarioCreate,
    UsuarioOut,
    UsuarioUpdate,
)
from app.modules.auth.service import AuthService, UsuarioService
from app.shared.schemas import PaginatedResponse

auth_router = APIRouter(prefix="/auth", tags=["Autenticacion"])
usuarios_router = APIRouter(prefix="/usuarios", tags=["Usuarios"])


@auth_router.post("/login", response_model=Token)
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)) -> Token:
    return AuthService(db).login(email=form_data.username, password=form_data.password)


@auth_router.post("/refresh", response_model=Token)
def refresh(body: RefreshTokenRequest, db: Session = Depends(get_db)) -> Token:
    return AuthService(db).refresh(body.refresh_token)


@auth_router.get("/me", response_model=UsuarioOut)
def me(current_user: Usuario = Depends(get_current_user)) -> Usuario:
    return current_user


@usuarios_router.post("", response_model=UsuarioOut, status_code=status.HTTP_201_CREATED)
def crear_usuario(
    data: UsuarioCreate,
    db: Session = Depends(get_db),
    _: Usuario = Depends(require_role(RolEnum.ADMIN_RRHH.value)),
) -> Usuario:
    return UsuarioService(db).crear_usuario(data)


@usuarios_router.get("", response_model=PaginatedResponse[UsuarioOut])
def listar_usuarios(
    page: int = Query(1, ge=1),
    size: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
    _: Usuario = Depends(require_role(RolEnum.ADMIN_RRHH.value)),
) -> PaginatedResponse[UsuarioOut]:
    items, total, pages = UsuarioService(db).listar_usuarios(page, size)
    return PaginatedResponse[UsuarioOut](items=items, total=total, page=page, pages=pages)


@usuarios_router.get("/{usuario_id}", response_model=UsuarioOut)
def obtener_usuario(
    usuario_id: UUID,
    db: Session = Depends(get_db),
    _: Usuario = Depends(require_role(RolEnum.ADMIN_RRHH.value)),
) -> Usuario:
    return UsuarioService(db).obtener_usuario(usuario_id)


@usuarios_router.patch("/{usuario_id}", response_model=UsuarioOut)
def actualizar_usuario(
    usuario_id: UUID,
    data: UsuarioUpdate,
    db: Session = Depends(get_db),
    _: Usuario = Depends(require_role(RolEnum.ADMIN_RRHH.value)),
) -> Usuario:
    return UsuarioService(db).actualizar_usuario(usuario_id, data)


@usuarios_router.delete("/{usuario_id}", status_code=status.HTTP_204_NO_CONTENT)
def desactivar_usuario(
    usuario_id: UUID,
    db: Session = Depends(get_db),
    _: Usuario = Depends(require_role(RolEnum.ADMIN_RRHH.value)),
) -> None:
    UsuarioService(db).desactivar_usuario(usuario_id)


@usuarios_router.patch("/me/password", status_code=status.HTTP_204_NO_CONTENT)
def cambiar_mi_password(
    body: CambiarPasswordRequest,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
) -> None:
    UsuarioService(db).cambiar_password(current_user, body.password_actual, body.password_nuevo)
