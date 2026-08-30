from datetime import date

from pydantic import BaseModel, Field, model_validator

from app.modules.asistencia.models import TipoPermisoEnum


class SolicitarPermisoRequest(BaseModel):
    tipo: TipoPermisoEnum
    fecha_inicio: date
    fecha_fin: date
    motivo: str | None = Field(default=None, max_length=1000)

    @model_validator(mode="after")
    def _validar_rango(self) -> "SolicitarPermisoRequest":
        if self.fecha_fin < self.fecha_inicio:
            raise ValueError("La fecha de fin no puede ser anterior a la fecha de inicio")
        return self
