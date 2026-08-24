from uuid import UUID

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.modules.reclutamiento.models import Candidato, Entrevista, EstadoVacanteEnum, Postulacion, Vacante


class VacanteRepository:
    def __init__(self, db: Session) -> None:
        self.db = db

    def get_by_id(self, vacante_id: UUID) -> Vacante | None:
        return self.db.get(Vacante, vacante_id)

    def list(
        self, page: int, size: int, estado: EstadoVacanteEnum | None = None, departamento_id: UUID | None = None
    ) -> tuple[list[Vacante], int]:
        stmt = select(Vacante)
        count_stmt = select(func.count()).select_from(Vacante)
        if estado is not None:
            stmt = stmt.where(Vacante.estado == estado)
            count_stmt = count_stmt.where(Vacante.estado == estado)
        if departamento_id is not None:
            stmt = stmt.where(Vacante.departamento_id == departamento_id)
            count_stmt = count_stmt.where(Vacante.departamento_id == departamento_id)
        total = self.db.execute(count_stmt).scalar_one()
        stmt = stmt.order_by(Vacante.creado_en.desc()).offset((page - 1) * size).limit(size)
        items = list(self.db.execute(stmt).scalars().all())
        return items, total

    def create(self, vacante: Vacante) -> Vacante:
        self.db.add(vacante)
        self.db.commit()
        self.db.refresh(vacante)
        return vacante

    def save(self, vacante: Vacante) -> Vacante:
        self.db.commit()
        self.db.refresh(vacante)
        return vacante


class CandidatoRepository:
    def __init__(self, db: Session) -> None:
        self.db = db

    def get_by_id(self, candidato_id: UUID) -> Candidato | None:
        return self.db.get(Candidato, candidato_id)

    def get_by_email(self, email: str) -> Candidato | None:
        stmt = select(Candidato).where(func.lower(Candidato.email) == email.lower())
        return self.db.execute(stmt).scalar_one_or_none()

    def list(self, page: int, size: int) -> tuple[list[Candidato], int]:
        total = self.db.execute(select(func.count()).select_from(Candidato)).scalar_one()
        stmt = select(Candidato).order_by(Candidato.creado_en.desc()).offset((page - 1) * size).limit(size)
        items = list(self.db.execute(stmt).scalars().all())
        return items, total

    def create(self, candidato: Candidato) -> Candidato:
        self.db.add(candidato)
        self.db.commit()
        self.db.refresh(candidato)
        return candidato

    def save(self, candidato: Candidato) -> Candidato:
        self.db.commit()
        self.db.refresh(candidato)
        return candidato


class PostulacionRepository:
    def __init__(self, db: Session) -> None:
        self.db = db

    def get_by_id(self, postulacion_id: UUID) -> Postulacion | None:
        return self.db.get(Postulacion, postulacion_id)

    def list_by_vacante(self, vacante_id: UUID) -> list[Postulacion]:
        stmt = (
            select(Postulacion)
            .where(Postulacion.vacante_id == vacante_id)
            .order_by(Postulacion.fecha_postulacion.desc())
        )
        return list(self.db.execute(stmt).scalars().all())

    def create(self, postulacion: Postulacion) -> Postulacion:
        self.db.add(postulacion)
        self.db.commit()
        self.db.refresh(postulacion)
        return postulacion

    def save(self, postulacion: Postulacion) -> Postulacion:
        self.db.commit()
        self.db.refresh(postulacion)
        return postulacion


class EntrevistaRepository:
    def __init__(self, db: Session) -> None:
        self.db = db

    def get_by_id(self, entrevista_id: UUID) -> Entrevista | None:
        return self.db.get(Entrevista, entrevista_id)

    def list_by_postulacion(self, postulacion_id: UUID) -> list[Entrevista]:
        stmt = (
            select(Entrevista).where(Entrevista.postulacion_id == postulacion_id).order_by(Entrevista.fecha_hora)
        )
        return list(self.db.execute(stmt).scalars().all())

    def create(self, entrevista: Entrevista) -> Entrevista:
        self.db.add(entrevista)
        self.db.commit()
        self.db.refresh(entrevista)
        return entrevista

    def save(self, entrevista: Entrevista) -> Entrevista:
        self.db.commit()
        self.db.refresh(entrevista)
        return entrevista
