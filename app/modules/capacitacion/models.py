import enum
import uuid
from datetime import date
from decimal import Decimal

from sqlalchemy import Boolean, Date, Enum, ForeignKey, Integer, Numeric, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.shared.models import Base, TimestampMixin


class EstadoInscripcionEnum(str, enum.Enum):
    INSCRITO = "INSCRITO"
    EN_PROGRESO = "EN_PROGRESO"
    COMPLETADO = "COMPLETADO"
    ABANDONADO = "ABANDONADO"


class Curso(Base, TimestampMixin):
    __tablename__ = "cursos"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    nombre: Mapped[str] = mapped_column(String(150), nullable=False)
    descripcion: Mapped[str | None] = mapped_column(Text, nullable=True)
    obligatorio: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    duracion_horas: Mapped[int] = mapped_column(Integer, nullable=False)


class Inscripcion(Base, TimestampMixin):
    __tablename__ = "inscripciones"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    curso_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("cursos.id"), nullable=False, index=True)
    empleado_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("empleados.id"), nullable=False, index=True)
    estado: Mapped[EstadoInscripcionEnum] = mapped_column(
        Enum(EstadoInscripcionEnum, native_enum=False, length=20), default=EstadoInscripcionEnum.INSCRITO, nullable=False
    )
    progreso: Mapped[Decimal] = mapped_column(Numeric(5, 2), default=0, nullable=False)
    fecha_finalizacion: Mapped[date | None] = mapped_column(Date, nullable=True)
    certificado_url: Mapped[str | None] = mapped_column(String(500), nullable=True)

    def actualizar_progreso(self, progreso: Decimal) -> None:
        self.progreso = progreso
        if progreso >= 100:
            self.estado = EstadoInscripcionEnum.COMPLETADO
            self.fecha_finalizacion = date.today()
        elif progreso > 0:
            self.estado = EstadoInscripcionEnum.EN_PROGRESO
        else:
            self.estado = EstadoInscripcionEnum.INSCRITO
