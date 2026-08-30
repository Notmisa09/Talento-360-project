from datetime import date, datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field

from app.modules.capacitacion.models import EstadoInscripcionEnum


class CursoCreate(BaseModel):
    nombre: str = Field(min_length=2, max_length=150)
    descripcion: str | None = Field(default=None, max_length=2000)
    obligatorio: bool = False
    duracion_horas: int = Field(gt=0, le=2000)


class CursoOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    nombre: str
    descripcion: str | None
    obligatorio: bool
    duracion_horas: int


class InscribirEmpleadoRequest(BaseModel):
    empleado_id: UUID


class ActualizarProgresoRequest(BaseModel):
    progreso: float = Field(ge=0, le=100)


class InscripcionOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    curso_id: UUID
    empleado_id: UUID
    estado: EstadoInscripcionEnum
    progreso: float
    fecha_finalizacion: date | None
    certificado_url: str | None
    creado_en: datetime
