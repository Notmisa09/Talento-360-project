from datetime import date, datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, EmailStr, Field

from app.modules.empleados.models import TipoContratoEnum
from app.modules.reclutamiento.models import (
    EstadoPostulacionEnum,
    EstadoVacanteEnum,
    ModalidadEntrevistaEnum,
)


class VacanteCreate(BaseModel):
    titulo: str = Field(min_length=2, max_length=150)
    descripcion: str | None = None
    departamento_id: UUID
    sucursal_id: UUID
    numero_posiciones: int = Field(default=1, ge=1)


class VacanteOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    titulo: str
    descripcion: str | None
    departamento_id: UUID
    sucursal_id: UUID
    estado: EstadoVacanteEnum
    fecha_publicacion: date | None
    fecha_cierre: date | None
    numero_posiciones: int
    creado_en: datetime


class CandidatoCreate(BaseModel):
    nombres: str = Field(min_length=2, max_length=100)
    apellidos: str = Field(min_length=2, max_length=100)
    email: EmailStr
    telefono: str | None = None
    linkedin: str | None = None


class CandidatoOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    nombres: str
    apellidos: str
    email: EmailStr
    telefono: str | None
    cv_url: str | None
    linkedin: str | None


class PostulacionCreate(BaseModel):
    candidato_id: UUID


class CambiarEstadoPostulacionRequest(BaseModel):
    estado: EstadoPostulacionEnum


class RechazarPostulacionRequest(BaseModel):
    motivo: str | None = None


class PostulacionOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    vacante_id: UUID
    candidato_id: UUID
    estado: EstadoPostulacionEnum
    fecha_postulacion: datetime
    puntaje_filtro: int | None
    motivo_rechazo: str | None


class EntrevistaCreate(BaseModel):
    entrevistador_id: UUID
    fecha_hora: datetime
    modalidad: ModalidadEntrevistaEnum
    comentarios: str | None = None


class EntrevistaActualizar(BaseModel):
    comentarios: str | None = None
    calificacion: int | None = Field(default=None, ge=1, le=5)


class EntrevistaOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    postulacion_id: UUID
    entrevistador_id: UUID
    fecha_hora: datetime
    modalidad: ModalidadEntrevistaEnum
    comentarios: str | None
    calificacion: int | None


class ContratarPostulacionRequest(BaseModel):
    cedula_o_dni: str = Field(min_length=5, max_length=30)
    fecha_nacimiento: date
    fecha_ingreso: date
    puesto_id: UUID
    tipo_contrato: TipoContratoEnum
    salario: float = Field(gt=0)
