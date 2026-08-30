from uuid import UUID

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.modules.capacitacion.models import Curso, EstadoInscripcionEnum, Inscripcion


class CursoRepository:
    def __init__(self, db: Session) -> None:
        self.db = db

    def get_by_id(self, curso_id: UUID) -> Curso | None:
        return self.db.get(Curso, curso_id)

    def list(self) -> list[Curso]:
        stmt = select(Curso).order_by(Curso.nombre)
        return list(self.db.execute(stmt).scalars().all())

    def create(self, curso: Curso) -> Curso:
        self.db.add(curso)
        self.db.commit()
        self.db.refresh(curso)
        return curso


class InscripcionRepository:
    def __init__(self, db: Session) -> None:
        self.db = db

    def get_by_id(self, inscripcion_id: UUID) -> Inscripcion | None:
        return self.db.get(Inscripcion, inscripcion_id)

    def list_by_curso(self, curso_id: UUID) -> list[Inscripcion]:
        stmt = select(Inscripcion).where(Inscripcion.curso_id == curso_id).order_by(Inscripcion.creado_en.desc())
        return list(self.db.execute(stmt).scalars().all())

    def list_by_empleado(self, empleado_id: UUID) -> list[Inscripcion]:
        stmt = select(Inscripcion).where(Inscripcion.empleado_id == empleado_id).order_by(Inscripcion.creado_en.desc())
        return list(self.db.execute(stmt).scalars().all())

    def list_completados_por_empleado(self, empleado_id: UUID) -> list[Inscripcion]:
        stmt = select(Inscripcion).where(
            Inscripcion.empleado_id == empleado_id, Inscripcion.estado == EstadoInscripcionEnum.COMPLETADO
        )
        return list(self.db.execute(stmt).scalars().all())

    def get_activa(self, curso_id: UUID, empleado_id: UUID) -> Inscripcion | None:
        stmt = select(Inscripcion).where(
            Inscripcion.curso_id == curso_id,
            Inscripcion.empleado_id == empleado_id,
            Inscripcion.estado != EstadoInscripcionEnum.ABANDONADO,
        )
        return self.db.execute(stmt).scalars().first()

    def create(self, inscripcion: Inscripcion) -> Inscripcion:
        self.db.add(inscripcion)
        self.db.commit()
        self.db.refresh(inscripcion)
        return inscripcion

    def save(self, inscripcion: Inscripcion) -> Inscripcion:
        self.db.commit()
        self.db.refresh(inscripcion)
        return inscripcion
