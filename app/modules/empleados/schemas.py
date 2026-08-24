from datetime import date, datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field

from app.modules.empleados.models import (
    EstadoContratoEnum,
    EstadoEmpleadoEnum,
    TipoContratoEnum,
    TipoDocumentoEnum,
)


class SucursalCreate(BaseModel):
    nombre: str = Field(min_length=2, max_length=150)
    direccion: str | None = None
    ciudad: str | None = None


class SucursalUpdate(BaseModel):
    nombre: str | None = None
    direccion: str | None = None
    ciudad: str | None = None


class SucursalOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    nombre: str
    direccion: str | None
    ciudad: str | None


class DepartamentoCreate(BaseModel):
    nombre: str = Field(min_length=2, max_length=150)
    gerente_id: UUID | None = None


class DepartamentoUpdate(BaseModel):
    nombre: str | None = None
    gerente_id: UUID | None = None


class DepartamentoOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    nombre: str
    gerente_id: UUID | None


class PuestoCreate(BaseModel):
    titulo: str = Field(min_length=2, max_length=150)
    salario_base: float = Field(gt=0)
    descripcion: str | None = None
    departamento_id: UUID


class PuestoUpdate(BaseModel):
    titulo: str | None = None
    salario_base: float | None = Field(default=None, gt=0)
    descripcion: str | None = None
    departamento_id: UUID | None = None


class PuestoOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    titulo: str
    salario_base: float
    descripcion: str | None
    departamento_id: UUID


class ContratoCreate(BaseModel):
    tipo: TipoContratoEnum
    fecha_inicio: date
    fecha_fin: date | None = None
    salario: float = Field(gt=0)
    documento_url: str | None = None


class ContratoUpdate(BaseModel):
    fecha_fin: date | None = None
    salario: float | None = Field(default=None, gt=0)
    estado: EstadoContratoEnum | None = None


class ContratoOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    empleado_id: UUID
    tipo: TipoContratoEnum
    fecha_inicio: date
    fecha_fin: date | None
    salario: float
    documento_url: str | None
    estado: EstadoContratoEnum
    creado_en: datetime


class DatosLegalesUpsert(BaseModel):
    numero_seguridad_social: str | None = None
    beneficiarios: str | None = None
    informacion_emergencia: str | None = None


class DatosLegalesOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    empleado_id: UUID
    numero_seguridad_social: str | None
    beneficiarios: str | None
    informacion_emergencia: str | None


class DocumentoExpedienteOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    empleado_id: UUID
    tipo: TipoDocumentoEnum
    nombre_archivo: str
    fecha_carga: datetime


class EmpleadoCreate(BaseModel):
    nombres: str = Field(min_length=2, max_length=100)
    apellidos: str = Field(min_length=2, max_length=100)
    cedula_o_dni: str = Field(min_length=5, max_length=30)
    fecha_nacimiento: date
    telefono: str | None = None
    direccion: str | None = None
    fecha_ingreso: date
    puesto_id: UUID
    sucursal_id: UUID
    departamento_id: UUID
    usuario_id: UUID | None = None


class EmpleadoUpdate(BaseModel):
    nombres: str | None = None
    apellidos: str | None = None
    telefono: str | None = None
    direccion: str | None = None
    puesto_id: UUID | None = None
    sucursal_id: UUID | None = None
    departamento_id: UUID | None = None
    usuario_id: UUID | None = None


class CambiarEstadoEmpleadoRequest(BaseModel):
    estado: EstadoEmpleadoEnum


class EmpleadoOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    codigo_empleado: str
    nombres: str
    apellidos: str
    cedula_o_dni: str
    fecha_nacimiento: date
    telefono: str | None
    direccion: str | None
    estado: EstadoEmpleadoEnum
    fecha_ingreso: date
    puesto_id: UUID
    sucursal_id: UUID
    departamento_id: UUID
    usuario_id: UUID | None
    creado_en: datetime


class ExpedienteOut(BaseModel):
    empleado: EmpleadoOut
    contratos: list[ContratoOut]
    documentos: list[DocumentoExpedienteOut]
    datos_legales: DatosLegalesOut | None
    antiguedad_anios: int
