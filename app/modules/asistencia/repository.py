from datetime import date, datetime
from uuid import UUID

from sqlalchemy import and_, func, select
from sqlalchemy.orm import Session

from app.modules.asistencia.models import EstadoSolicitudEnum, RegistroAsistencia, SaldoVacaciones, SolicitudPermiso


class RegistroAsistenciaRepository:
    def __init__(self, db: Session) -> None:
        self.db = db

    def get_by_id(self, registro_id: UUID) -> RegistroAsistencia | None:
        return self.db.get(RegistroAsistencia, registro_id)

    def get_abierto(self, empleado_id: UUID) -> RegistroAsistencia | None:
        stmt = select(RegistroAsistencia).where(
            RegistroAsistencia.empleado_id == empleado_id, RegistroAsistencia.hora_salida.is_(None)
        )
        return self.db.execute(stmt).scalar_one_or_none()

    def list_by_empleado(
        self, empleado_id: UUID, desde: datetime | None = None, hasta: datetime | None = None
    ) -> list[RegistroAsistencia]:
        stmt = select(RegistroAsistencia).where(RegistroAsistencia.empleado_id == empleado_id)
        if desde is not None:
            stmt = stmt.where(RegistroAsistencia.hora_entrada >= desde)
        if hasta is not None:
            stmt = stmt.where(RegistroAsistencia.hora_entrada <= hasta)
        stmt = stmt.order_by(RegistroAsistencia.hora_entrada.desc())
        return list(self.db.execute(stmt).scalars().all())

    def sumar_horas_extra_en_rango(self, empleado_id: UUID, desde: date, hasta: date) -> float:
        stmt = select(func.coalesce(func.sum(RegistroAsistencia.horas_extra), 0)).where(
            RegistroAsistencia.empleado_id == empleado_id,
            func.date(RegistroAsistencia.hora_entrada) >= desde,
            func.date(RegistroAsistencia.hora_entrada) <= hasta,
        )
        return float(self.db.execute(stmt).scalar_one())

    def create(self, registro: RegistroAsistencia) -> RegistroAsistencia:
        self.db.add(registro)
        self.db.commit()
        self.db.refresh(registro)
        return registro

    def save(self, registro: RegistroAsistencia) -> RegistroAsistencia:
        self.db.commit()
        self.db.refresh(registro)
        return registro


class SolicitudPermisoRepository:
    def __init__(self, db: Session) -> None:
        self.db = db

    def get_by_id(self, solicitud_id: UUID) -> SolicitudPermiso | None:
        return self.db.get(SolicitudPermiso, solicitud_id)

    def list(
        self, empleado_id: UUID | None = None, estado: EstadoSolicitudEnum | None = None
    ) -> list[SolicitudPermiso]:
        stmt = select(SolicitudPermiso)
        if empleado_id is not None:
            stmt = stmt.where(SolicitudPermiso.empleado_id == empleado_id)
        if estado is not None:
            stmt = stmt.where(SolicitudPermiso.estado == estado)
        stmt = stmt.order_by(SolicitudPermiso.creado_en.desc())
        return list(self.db.execute(stmt).scalars().all())

    def create(self, solicitud: SolicitudPermiso) -> SolicitudPermiso:
        self.db.add(solicitud)
        self.db.commit()
        self.db.refresh(solicitud)
        return solicitud

    def save(self, solicitud: SolicitudPermiso) -> SolicitudPermiso:
        self.db.commit()
        self.db.refresh(solicitud)
        return solicitud


class SaldoVacacionesRepository:
    def __init__(self, db: Session) -> None:
        self.db = db

    def get_by_empleado_anio(self, empleado_id: UUID, anio: int) -> SaldoVacaciones | None:
        stmt = select(SaldoVacaciones).where(
            and_(SaldoVacaciones.empleado_id == empleado_id, SaldoVacaciones.anio == anio)
        )
        return self.db.execute(stmt).scalar_one_or_none()

    def create(self, saldo: SaldoVacaciones) -> SaldoVacaciones:
        self.db.add(saldo)
        self.db.commit()
        self.db.refresh(saldo)
        return saldo

    def save(self, saldo: SaldoVacaciones) -> SaldoVacaciones:
        self.db.commit()
        self.db.refresh(saldo)
        return saldo
