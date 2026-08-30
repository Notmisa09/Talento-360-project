from datetime import date, datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field, model_validator

from app.modules.asistencia.models import EstadoSolicitudEnum, TipoPermisoEnum


class MarcajeEntradaRequest(BaseModel):
    empleado_id: UUID
    origen: str = Field(default="MANUAL", max_length=30)


class MarcajeSalidaRequest(BaseModel):
    empleado_id: UUID


class RegistroAsistenciaOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    empleado_id: UUID
    hora_entrada: datetime
    hora_salida: datetime | None
    horas_trabajadas: float | None
    horas_extra: float | None
    origen: str


class ResumenAsistenciaOut(BaseModel):
    empleado_id: UUID
    mes: str
    dias_registrados: int
    horas_trabajadas_total: float
    horas_extra_total: float


class SolicitudPermisoCreate(BaseModel):
    empleado_id: UUID
    tipo: TipoPermisoEnum
    fecha_inicio: date
    fecha_fin: date
    motivo: str | None = Field(default=None, max_length=1000)

    @model_validator(mode="after")
    def _validar_rango(self) -> "SolicitudPermisoCreate":
        if self.fecha_fin < self.fecha_inicio:
            raise ValueError("La fecha de fin no puede ser anterior a la fecha de inicio")
        return self


class RechazarSolicitudRequest(BaseModel):
    motivo: str | None = Field(default=None, max_length=1000)


class SolicitudPermisoOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    empleado_id: UUID
    tipo: TipoPermisoEnum
    fecha_inicio: date
    fecha_fin: date
    motivo: str | None
    estado: EstadoSolicitudEnum
    aprobado_por: UUID | None
    motivo_rechazo: str | None
    dias_solicitados: int
    creado_en: datetime


class SaldoVacacionesOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    empleado_id: UUID
    dias_disponibles: int
    dias_tomados: int
    anio: int


class AjustarSaldoVacacionesRequest(BaseModel):
    dias_disponibles: int = Field(ge=0, le=365)
    anio: int | None = None
