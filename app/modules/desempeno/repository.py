from uuid import UUID

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.modules.desempeno.models import CicloEvaluacion, Evaluacion, Objetivo


class CicloEvaluacionRepository:
    def __init__(self, db: Session) -> None:
        self.db = db

    def get_by_id(self, ciclo_id: UUID) -> CicloEvaluacion | None:
        return self.db.get(CicloEvaluacion, ciclo_id)

    def list(self) -> list[CicloEvaluacion]:
        stmt = select(CicloEvaluacion).order_by(CicloEvaluacion.fecha_inicio.desc())
        return list(self.db.execute(stmt).scalars().all())

    def create(self, ciclo: CicloEvaluacion) -> CicloEvaluacion:
        self.db.add(ciclo)
        self.db.commit()
        self.db.refresh(ciclo)
        return ciclo


class ObjetivoRepository:
    def __init__(self, db: Session) -> None:
        self.db = db

    def get_by_id(self, objetivo_id: UUID) -> Objetivo | None:
        return self.db.get(Objetivo, objetivo_id)

    def list_by_empleado(self, empleado_id: UUID) -> list[Objetivo]:
        stmt = select(Objetivo).where(Objetivo.empleado_id == empleado_id).order_by(Objetivo.creado_en.desc())
        return list(self.db.execute(stmt).scalars().all())

    def create(self, objetivo: Objetivo) -> Objetivo:
        self.db.add(objetivo)
        self.db.commit()
        self.db.refresh(objetivo)
        return objetivo

    def save(self, objetivo: Objetivo) -> Objetivo:
        self.db.commit()
        self.db.refresh(objetivo)
        return objetivo


class EvaluacionRepository:
    def __init__(self, db: Session) -> None:
        self.db = db

    def get_by_id(self, evaluacion_id: UUID) -> Evaluacion | None:
        return self.db.get(Evaluacion, evaluacion_id)

    def list_by_empleado(self, empleado_id: UUID) -> list[Evaluacion]:
        stmt = select(Evaluacion).where(Evaluacion.empleado_id == empleado_id).order_by(Evaluacion.creado_en.desc())
        return list(self.db.execute(stmt).scalars().all())

    def create(self, evaluacion: Evaluacion) -> Evaluacion:
        self.db.add(evaluacion)
        self.db.commit()
        self.db.refresh(evaluacion)
        return evaluacion
