from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, EmailStr, Field

from app.modules.auth.models import RolEnum


class UsuarioCreate(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8, max_length=72)
    rol: RolEnum = RolEnum.EMPLEADO


class UsuarioUpdate(BaseModel):
    rol: RolEnum | None = None
    activo: bool | None = None


class UsuarioOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    email: EmailStr
    rol: RolEnum
    activo: bool
    fecha_creacion: datetime


class CambiarPasswordRequest(BaseModel):
    password_actual: str
    password_nuevo: str = Field(min_length=8, max_length=72)


class Token(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"


class RefreshTokenRequest(BaseModel):
    refresh_token: str


class ForgotPasswordRequest(BaseModel):
    email: EmailStr


class ResetPasswordRequest(BaseModel):
    token: str
    password_nuevo: str = Field(min_length=8, max_length=72)
