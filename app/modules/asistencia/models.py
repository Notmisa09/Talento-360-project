import enum
import uuid
from datetime import date, datetime, timezone
from decimal import Decimal

from sqlalchemy import Date, DateTime, Enum, ForeignKey, Integer, Numeric, String, Text, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column

from app.shared.models import Base, TimestampMixin

HORAS_JORNADA_ESTANDAR = Decimal("8")
DIAS_VACACIONES_ANUALES_DEFECTO = 15


class TipoPermisoEnum(str, enum.Enum):
    VACACIONES = "VACACIONES"
    ENFERMEDAD = "ENFERMEDAD"
    PERSONAL = "PERSONAL"
    LUTO = "LUTO"
    MATERNIDAD_PATERNIDAD = "MATERNIDAD_PATERNIDAD"
    OTRO = "OTRO"


class EstadoSolicitudEnum(str, enum.Enum):
    PENDIENTE = "PENDIENTE"
    APROBADA = "APROBADA"
    RECHAZADA = "RECHAZADA"


class RegistroAsistencia(Base, TimestampMixin):
    __tablename__ = "registros_asistencia"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    empleado_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("empleados.id"), nullable=False, index=True)
    hora_entrada: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    hora_salida: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    horas_trabajadas: Mapped[Decimal | None] = mapped_column(Numeric(5, 2), nullable=True)
    horas_extra: Mapped[Decimal | None] = mapped_column(Numeric(5, 2), nullable=True)
    origen: Mapped[str] = mapped_column(String(30), default="MANUAL", nullable=False)

    def calcular_horas(self) -> None:
        """Calcula horas trabajadas/extra a partir de hora_entrada/hora_salida. Requiere hora_salida seteada.

        SQLite no conserva tzinfo en columnas DateTime(timezone=True): un valor recien
        asignado en Python llega aware, pero uno recuperado de la BD llega naive. Se
        normalizan ambos a UTC antes de restar para evitar TypeError en ese backend.
        """
        if self.hora_salida is None:
            return
        entrada = self.hora_entrada if self.hora_entrada.tzinfo else self.hora_entrada.replace(tzinfo=timezone.utc)
        salida = self.hora_salida if self.hora_salida.tzinfo else self.hora_salida.replace(tzinfo=timezone.utc)
        segundos = (salida - entrada).total_seconds()
        horas = Decimal(segundos) / Decimal(3600)
        horas = horas.quantize(Decimal("0.01"))
        self.horas_trabajadas = max(horas, Decimal("0"))
        self.horas_extra = max(self.horas_trabajadas - HORAS_JORNADA_ESTANDAR, Decimal("0"))


class SolicitudPermiso(Base, TimestampMixin):
    __tablename__ = "solicitudes_permiso"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    empleado_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("empleados.id"), nullable=False, index=True)
    tipo: Mapped[TipoPermisoEnum] = mapped_column(Enum(TipoPermisoEnum, native_enum=False, length=30), nullable=False)
    fecha_inicio: Mapped[date] = mapped_column(Date, nullable=False)
    fecha_fin: Mapped[date] = mapped_column(Date, nullable=False)
    motivo: Mapped[str | None] = mapped_column(Text, nullable=True)
    estado: Mapped[EstadoSolicitudEnum] = mapped_column(
        Enum(EstadoSolicitudEnum, native_enum=False, length=20), default=EstadoSolicitudEnum.PENDIENTE, nullable=False
    )
    aprobado_por: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("usuarios.id"), nullable=True)
    motivo_rechazo: Mapped[str | None] = mapped_column(Text, nullable=True)

    @property
    def dias_solicitados(self) -> int:
        return (self.fecha_fin - self.fecha_inicio).days + 1

    def aprobar(self, aprobado_por: uuid.UUID) -> None:
        self.estado = EstadoSolicitudEnum.APROBADA
        self.aprobado_por = aprobado_por

    def rechazar(self, aprobado_por: uuid.UUID, motivo: str | None) -> None:
        self.estado = EstadoSolicitudEnum.RECHAZADA
        self.aprobado_por = aprobado_por
        self.motivo_rechazo = motivo


class SaldoVacaciones(Base, TimestampMixin):
    __tablename__ = "saldos_vacaciones"
    __table_args__ = (UniqueConstraint("empleado_id", "anio", name="uq_saldo_vacaciones_empleado_anio"),)

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    empleado_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("empleados.id"), nullable=False, index=True)
    dias_disponibles: Mapped[int] = mapped_column(Integer, default=DIAS_VACACIONES_ANUALES_DEFECTO, nullable=False)
    dias_tomados: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    anio: Mapped[int] = mapped_column(Integer, nullable=False)
