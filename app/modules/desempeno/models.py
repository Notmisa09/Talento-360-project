import uuid
from datetime import date
from decimal import Decimal

from sqlalchemy import Date, ForeignKey, Numeric, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.shared.models import Base, TimestampMixin


class CicloEvaluacion(Base, TimestampMixin):
    __tablename__ = "ciclos_evaluacion"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    nombre: Mapped[str] = mapped_column(String(150), nullable=False)
    fecha_inicio: Mapped[date] = mapped_column(Date, nullable=False)
    fecha_fin: Mapped[date] = mapped_column(Date, nullable=False)


class Objetivo(Base, TimestampMixin):
    __tablename__ = "objetivos"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    empleado_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("empleados.id"), nullable=False, index=True)
    ciclo_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("ciclos_evaluacion.id"), nullable=False, index=True)
    descripcion: Mapped[str] = mapped_column(Text, nullable=False)
    meta_valor: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False)
    valor_actual: Mapped[Decimal] = mapped_column(Numeric(12, 2), default=0, nullable=False)

    def calcular_progreso(self) -> float:
        if not self.meta_valor:
            return 0.0
        return round(float(self.valor_actual) / float(self.meta_valor) * 100, 2)

    @property
    def progreso(self) -> float:
        return self.calcular_progreso()


class Evaluacion(Base, TimestampMixin):
    __tablename__ = "evaluaciones"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    empleado_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("empleados.id"), nullable=False, index=True)
    evaluador_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("usuarios.id"), nullable=False)
    ciclo_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("ciclos_evaluacion.id"), nullable=False, index=True)
    calificacion_final: Mapped[Decimal] = mapped_column(Numeric(5, 2), nullable=False)
    comentarios: Mapped[str | None] = mapped_column(Text, nullable=True)
    plan_mejora: Mapped[str | None] = mapped_column(Text, nullable=True)
