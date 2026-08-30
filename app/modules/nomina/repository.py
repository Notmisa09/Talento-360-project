from uuid import UUID

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.modules.nomina.models import ConceptoNomina, EstadoPeriodoEnum, Nomina, PeriodoNomina


class PeriodoNominaRepository:
    def __init__(self, db: Session) -> None:
        self.db = db

    def get_by_id(self, periodo_id: UUID) -> PeriodoNomina | None:
        return self.db.get(PeriodoNomina, periodo_id)

    def list(self) -> list[PeriodoNomina]:
        stmt = select(PeriodoNomina).order_by(PeriodoNomina.fecha_inicio.desc())
        return list(self.db.execute(stmt).scalars().all())

    def list_solapados(self, fecha_inicio, fecha_fin) -> list[PeriodoNomina]:
        stmt = select(PeriodoNomina).where(
            PeriodoNomina.fecha_inicio <= fecha_fin, PeriodoNomina.fecha_fin >= fecha_inicio
        )
        return list(self.db.execute(stmt).scalars().all())

    def create(self, periodo: PeriodoNomina) -> PeriodoNomina:
        self.db.add(periodo)
        self.db.commit()
        self.db.refresh(periodo)
        return periodo

    def save(self, periodo: PeriodoNomina) -> PeriodoNomina:
        self.db.commit()
        self.db.refresh(periodo)
        return periodo


class NominaRepository:
    def __init__(self, db: Session) -> None:
        self.db = db

    def get_by_id(self, nomina_id: UUID) -> Nomina | None:
        return self.db.get(Nomina, nomina_id)

    def list_by_empleado(self, empleado_id: UUID) -> list[Nomina]:
        stmt = select(Nomina).where(Nomina.empleado_id == empleado_id).order_by(Nomina.creado_en.desc())
        return list(self.db.execute(stmt).scalars().all())

    def get_by_periodo_y_empleado(self, periodo_id: UUID, empleado_id: UUID) -> Nomina | None:
        stmt = select(Nomina).where(Nomina.periodo_id == periodo_id, Nomina.empleado_id == empleado_id)
        return self.db.execute(stmt).scalar_one_or_none()

    def create(self, nomina: Nomina) -> Nomina:
        self.db.add(nomina)
        self.db.flush()
        return nomina


class ConceptoNominaRepository:
    def __init__(self, db: Session) -> None:
        self.db = db

    def list_by_nomina(self, nomina_id: UUID) -> list[ConceptoNomina]:
        stmt = select(ConceptoNomina).where(ConceptoNomina.nomina_id == nomina_id)
        return list(self.db.execute(stmt).scalars().all())

    def create(self, concepto: ConceptoNomina) -> ConceptoNomina:
        self.db.add(concepto)
        self.db.flush()
        return concepto
