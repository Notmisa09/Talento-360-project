import enum
import uuid
from datetime import date
from decimal import Decimal

from sqlalchemy import Date, Enum, ForeignKey, Numeric, String
from sqlalchemy.orm import Mapped, mapped_column

from app.shared.models import Base, TimestampMixin


class EstadoPeriodoEnum(str, enum.Enum):
    ABIERTO = "ABIERTO"
    PROCESADO = "PROCESADO"
    CERRADO = "CERRADO"


class TipoConceptoEnum(str, enum.Enum):
    SALARIO_BASE = "SALARIO_BASE"
    HORAS_EXTRA = "HORAS_EXTRA"
    BONIFICACION = "BONIFICACION"
    DEDUCCION_SFS = "DEDUCCION_SFS"
    DEDUCCION_AFP = "DEDUCCION_AFP"
    DEDUCCION_ISR = "DEDUCCION_ISR"
    OTRO = "OTRO"


DEDUCCIONES = frozenset({TipoConceptoEnum.DEDUCCION_SFS, TipoConceptoEnum.DEDUCCION_AFP, TipoConceptoEnum.DEDUCCION_ISR})
DEVENGOS = frozenset({TipoConceptoEnum.SALARIO_BASE, TipoConceptoEnum.HORAS_EXTRA})
BONIFICACIONES = frozenset({TipoConceptoEnum.BONIFICACION})


class PeriodoNomina(Base, TimestampMixin):
    __tablename__ = "periodos_nomina"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    fecha_inicio: Mapped[date] = mapped_column(Date, nullable=False)
    fecha_fin: Mapped[date] = mapped_column(Date, nullable=False)
    estado: Mapped[EstadoPeriodoEnum] = mapped_column(
        Enum(EstadoPeriodoEnum, native_enum=False, length=20), default=EstadoPeriodoEnum.ABIERTO, nullable=False
    )

    def procesar(self) -> None:
        self.estado = EstadoPeriodoEnum.PROCESADO

    def cerrar(self) -> None:
        self.estado = EstadoPeriodoEnum.CERRADO


class Nomina(Base, TimestampMixin):
    __tablename__ = "nominas"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    periodo_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("periodos_nomina.id"), nullable=False, index=True)
    empleado_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("empleados.id"), nullable=False, index=True)
    salario_bruto: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False)
    total_deducciones: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False, default=0)
    total_bonificaciones: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False, default=0)
    salario_neto: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False)


class ConceptoNomina(Base, TimestampMixin):
    __tablename__ = "conceptos_nomina"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    nomina_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("nominas.id"), nullable=False, index=True)
    tipo: Mapped[TipoConceptoEnum] = mapped_column(Enum(TipoConceptoEnum, native_enum=False, length=30), nullable=False)
    descripcion: Mapped[str] = mapped_column(String(255), nullable=False)
    monto: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False)
