import enum
import uuid
from datetime import date, datetime

from sqlalchemy import Date, DateTime, Enum, ForeignKey, Integer, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column

from app.shared.models import Base, TimestampMixin


class EstadoVacanteEnum(str, enum.Enum):
    BORRADOR = "BORRADOR"
    PUBLICADA = "PUBLICADA"
    CERRADA = "CERRADA"


class EstadoPostulacionEnum(str, enum.Enum):
    RECIBIDA = "RECIBIDA"
    EN_FILTRO = "EN_FILTRO"
    ENTREVISTA = "ENTREVISTA"
    OFERTA = "OFERTA"
    CONTRATADO = "CONTRATADO"
    RECHAZADA = "RECHAZADA"


class ModalidadEntrevistaEnum(str, enum.Enum):
    PRESENCIAL = "PRESENCIAL"
    VIRTUAL = "VIRTUAL"
    TELEFONICA = "TELEFONICA"


class Vacante(Base, TimestampMixin):
    __tablename__ = "vacantes"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    titulo: Mapped[str] = mapped_column(String(150), nullable=False)
    descripcion: Mapped[str | None] = mapped_column(Text, nullable=True)
    departamento_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("departamentos.id"), nullable=False)
    sucursal_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("sucursales.id"), nullable=False)
    estado: Mapped[EstadoVacanteEnum] = mapped_column(
        Enum(EstadoVacanteEnum, native_enum=False, length=20), default=EstadoVacanteEnum.BORRADOR, nullable=False
    )
    fecha_publicacion: Mapped[date | None] = mapped_column(Date, nullable=True)
    fecha_cierre: Mapped[date | None] = mapped_column(Date, nullable=True)
    numero_posiciones: Mapped[int] = mapped_column(Integer, default=1, nullable=False)

    def publicar(self) -> None:
        self.estado = EstadoVacanteEnum.PUBLICADA
        self.fecha_publicacion = date.today()

    def cerrar(self) -> None:
        self.estado = EstadoVacanteEnum.CERRADA
        self.fecha_cierre = date.today()


class Candidato(Base, TimestampMixin):
    __tablename__ = "candidatos"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    nombres: Mapped[str] = mapped_column(String(100), nullable=False)
    apellidos: Mapped[str] = mapped_column(String(100), nullable=False)
    email: Mapped[str] = mapped_column(String(255), index=True, nullable=False)
    telefono: Mapped[str | None] = mapped_column(String(30), nullable=True)
    cv_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    linkedin: Mapped[str | None] = mapped_column(String(255), nullable=True)


class Postulacion(Base, TimestampMixin):
    __tablename__ = "postulaciones"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    vacante_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("vacantes.id"), nullable=False, index=True)
    candidato_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("candidatos.id"), nullable=False, index=True)
    estado: Mapped[EstadoPostulacionEnum] = mapped_column(
        Enum(EstadoPostulacionEnum, native_enum=False, length=20),
        default=EstadoPostulacionEnum.RECIBIDA,
        nullable=False,
    )
    fecha_postulacion: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    puntaje_filtro: Mapped[int | None] = mapped_column(Integer, nullable=True)
    motivo_rechazo: Mapped[str | None] = mapped_column(Text, nullable=True)


class Entrevista(Base, TimestampMixin):
    __tablename__ = "entrevistas"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    postulacion_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("postulaciones.id"), nullable=False, index=True)
    entrevistador_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("usuarios.id"), nullable=False)
    fecha_hora: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    modalidad: Mapped[ModalidadEntrevistaEnum] = mapped_column(
        Enum(ModalidadEntrevistaEnum, native_enum=False, length=20), nullable=False
    )
    comentarios: Mapped[str | None] = mapped_column(Text, nullable=True)
    calificacion: Mapped[int | None] = mapped_column(Integer, nullable=True)
