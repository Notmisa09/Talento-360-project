import enum
import uuid
from datetime import date, datetime

from sqlalchemy import Date, DateTime, Enum, ForeignKey, Numeric, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column

from app.shared.models import Base, TimestampMixin


class EstadoEmpleadoEnum(str, enum.Enum):
    ACTIVO = "ACTIVO"
    INACTIVO = "INACTIVO"


class TipoContratoEnum(str, enum.Enum):
    INDEFINIDO = "INDEFINIDO"
    TEMPORAL = "TEMPORAL"
    POR_HORAS = "POR_HORAS"
    PRACTICA = "PRACTICA"


class EstadoContratoEnum(str, enum.Enum):
    VIGENTE = "VIGENTE"
    FINALIZADO = "FINALIZADO"
    CANCELADO = "CANCELADO"


class TipoDocumentoEnum(str, enum.Enum):
    CEDULA = "CEDULA"
    CV = "CV"
    CONTRATO = "CONTRATO"
    CERTIFICADO = "CERTIFICADO"
    TITULO = "TITULO"
    OTRO = "OTRO"


class Sucursal(Base, TimestampMixin):
    __tablename__ = "sucursales"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    nombre: Mapped[str] = mapped_column(String(150), nullable=False)
    direccion: Mapped[str | None] = mapped_column(String(255), nullable=True)
    ciudad: Mapped[str | None] = mapped_column(String(100), nullable=True)


class Departamento(Base, TimestampMixin):
    __tablename__ = "departamentos"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    nombre: Mapped[str] = mapped_column(String(150), nullable=False)
    # Sin FK de base de datos hacia empleados.id (dependencia circular con
    # empleado.departamento_id -> departamentos.id); se valida en la capa de servicio.
    gerente_id: Mapped[uuid.UUID | None] = mapped_column(nullable=True)


class Puesto(Base, TimestampMixin):
    __tablename__ = "puestos"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    titulo: Mapped[str] = mapped_column(String(150), nullable=False)
    salario_base: Mapped[float] = mapped_column(Numeric(12, 2), nullable=False)
    descripcion: Mapped[str | None] = mapped_column(Text, nullable=True)
    departamento_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("departamentos.id"), nullable=False)


class Empleado(Base, TimestampMixin):
    __tablename__ = "empleados"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    codigo_empleado: Mapped[str] = mapped_column(String(20), unique=True, index=True, nullable=False)
    nombres: Mapped[str] = mapped_column(String(100), nullable=False)
    apellidos: Mapped[str] = mapped_column(String(100), nullable=False)
    cedula_o_dni: Mapped[str] = mapped_column(String(30), unique=True, index=True, nullable=False)
    fecha_nacimiento: Mapped[date] = mapped_column(Date, nullable=False)
    telefono: Mapped[str | None] = mapped_column(String(30), nullable=True)
    direccion: Mapped[str | None] = mapped_column(String(255), nullable=True)
    estado: Mapped[EstadoEmpleadoEnum] = mapped_column(
        Enum(EstadoEmpleadoEnum, native_enum=False, length=20), default=EstadoEmpleadoEnum.ACTIVO, nullable=False
    )
    fecha_ingreso: Mapped[date] = mapped_column(Date, nullable=False)
    puesto_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("puestos.id"), nullable=False)
    sucursal_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("sucursales.id"), nullable=False)
    departamento_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("departamentos.id"), nullable=False)
    usuario_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("usuarios.id"), unique=True, nullable=True)

    def calcular_antiguedad(self) -> int:
        hoy = date.today()
        anios = hoy.year - self.fecha_ingreso.year
        if (hoy.month, hoy.day) < (self.fecha_ingreso.month, self.fecha_ingreso.day):
            anios -= 1
        return max(anios, 0)


class Contrato(Base, TimestampMixin):
    __tablename__ = "contratos"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    empleado_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("empleados.id"), nullable=False, index=True)
    tipo: Mapped[TipoContratoEnum] = mapped_column(Enum(TipoContratoEnum, native_enum=False, length=20), nullable=False)
    fecha_inicio: Mapped[date] = mapped_column(Date, nullable=False)
    fecha_fin: Mapped[date | None] = mapped_column(Date, nullable=True)
    salario: Mapped[float] = mapped_column(Numeric(12, 2), nullable=False)
    documento_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    estado: Mapped[EstadoContratoEnum] = mapped_column(
        Enum(EstadoContratoEnum, native_enum=False, length=20),
        default=EstadoContratoEnum.VIGENTE,
        nullable=False,
    )


class DocumentoExpediente(Base, TimestampMixin):
    __tablename__ = "documentos_expediente"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    empleado_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("empleados.id"), nullable=False, index=True)
    tipo: Mapped[TipoDocumentoEnum] = mapped_column(Enum(TipoDocumentoEnum, native_enum=False, length=20), nullable=False)
    nombre_archivo: Mapped[str] = mapped_column(String(255), nullable=False)
    url_archivo: Mapped[str] = mapped_column(String(500), nullable=False)
    fecha_carga: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    cargado_por: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("usuarios.id"), nullable=True)


class DatosLegales(Base, TimestampMixin):
    __tablename__ = "datos_legales"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    empleado_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("empleados.id"), unique=True, nullable=False)
    numero_seguridad_social: Mapped[str | None] = mapped_column(String(50), nullable=True)
    beneficiarios: Mapped[str | None] = mapped_column(Text, nullable=True)
    informacion_emergencia: Mapped[str | None] = mapped_column(Text, nullable=True)
