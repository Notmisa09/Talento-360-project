from datetime import date, datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field


class CicloEvaluacionCreate(BaseModel):
    nombre: str = Field(min_length=2, max_length=150)
    fecha_inicio: date
    fecha_fin: date


class CicloEvaluacionOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    nombre: str
    fecha_inicio: date
    fecha_fin: date


class ObjetivoCreate(BaseModel):
    empleado_id: UUID
    ciclo_id: UUID
    descripcion: str = Field(min_length=3, max_length=1000)
    meta_valor: float = Field(gt=0)


class ObjetivoAvanceRequest(BaseModel):
    valor_actual: float = Field(ge=0)


class ObjetivoOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    empleado_id: UUID
    ciclo_id: UUID
    descripcion: str
    meta_valor: float
    valor_actual: float
    progreso: float
    creado_en: datetime


class EvaluacionCreate(BaseModel):
    empleado_id: UUID
    evaluador_id: UUID
    ciclo_id: UUID
    calificacion_final: float = Field(ge=0, le=100)
    comentarios: str | None = None
    plan_mejora: str | None = None


class EvaluacionOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    empleado_id: UUID
    evaluador_id: UUID
    ciclo_id: UUID
    calificacion_final: float
    comentarios: str | None
    plan_mejora: str | None
    creado_en: datetime


class HistorialDesempenoOut(BaseModel):
    objetivos: list[ObjetivoOut]
    evaluaciones: list[EvaluacionOut]
