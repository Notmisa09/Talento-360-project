from datetime import date, datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field, model_validator

from app.modules.nomina.models import EstadoPeriodoEnum, TipoConceptoEnum


class PeriodoNominaCreate(BaseModel):
    fecha_inicio: date
    fecha_fin: date

    @model_validator(mode="after")
    def _validar_rango(self) -> "PeriodoNominaCreate":
        if self.fecha_fin <= self.fecha_inicio:
            raise ValueError("La fecha de fin debe ser posterior a la fecha de inicio")
        return self


class PeriodoNominaOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    fecha_inicio: date
    fecha_fin: date
    estado: EstadoPeriodoEnum
    creado_en: datetime


class ConceptoNominaOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    tipo: TipoConceptoEnum
    descripcion: str
    monto: float


class NominaOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    periodo_id: UUID
    empleado_id: UUID
    salario_bruto: float
    total_deducciones: float
    total_bonificaciones: float
    salario_neto: float
    creado_en: datetime


class NominaDetalleOut(NominaOut):
    conceptos: list[ConceptoNominaOut]


class ProcesarPeriodoResultadoOut(BaseModel):
    periodo: PeriodoNominaOut
    nominas_generadas: int = Field(ge=0)
