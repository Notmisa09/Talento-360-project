from uuid import UUID

from sqlalchemy.orm import Session

from app.modules.desempeno.exceptions import CicloEvaluacionNoEncontradoError, ObjetivoNoEncontradoError
from app.modules.desempeno.models import CicloEvaluacion, Evaluacion, Objetivo
from app.modules.desempeno.repository import CicloEvaluacionRepository, EvaluacionRepository, ObjetivoRepository
from app.modules.desempeno.schemas import CicloEvaluacionCreate, EvaluacionCreate, ObjetivoCreate
from app.modules.empleados.exceptions import EmpleadoNoEncontradoError
from app.modules.empleados.repository import EmpleadoRepository


class CicloEvaluacionService:
    def __init__(self, db: Session) -> None:
        self.repo = CicloEvaluacionRepository(db)

    def crear(self, data: CicloEvaluacionCreate) -> CicloEvaluacion:
        return self.repo.create(CicloEvaluacion(**data.model_dump()))

    def listar(self) -> list[CicloEvaluacion]:
        return self.repo.list()

    def obtener(self, ciclo_id: UUID) -> CicloEvaluacion:
        ciclo = self.repo.get_by_id(ciclo_id)
        if ciclo is None:
            raise CicloEvaluacionNoEncontradoError()
        return ciclo


class ObjetivoService:
    def __init__(self, db: Session) -> None:
        self.repo = ObjetivoRepository(db)
        self.empleados = EmpleadoRepository(db)
        self.ciclos = CicloEvaluacionRepository(db)

    def crear(self, data: ObjetivoCreate) -> Objetivo:
        if self.empleados.get_by_id(data.empleado_id) is None:
            raise EmpleadoNoEncontradoError()
        if self.ciclos.get_by_id(data.ciclo_id) is None:
            raise CicloEvaluacionNoEncontradoError()
        return self.repo.create(Objetivo(**data.model_dump()))

    def listar_por_empleado(self, empleado_id: UUID) -> list[Objetivo]:
        if self.empleados.get_by_id(empleado_id) is None:
            raise EmpleadoNoEncontradoError()
        return self.repo.list_by_empleado(empleado_id)

    def obtener(self, objetivo_id: UUID) -> Objetivo:
        objetivo = self.repo.get_by_id(objetivo_id)
        if objetivo is None:
            raise ObjetivoNoEncontradoError()
        return objetivo

    def actualizar_avance(self, objetivo_id: UUID, valor_actual: float) -> Objetivo:
        objetivo = self.obtener(objetivo_id)
        objetivo.valor_actual = valor_actual
        return self.repo.save(objetivo)


class EvaluacionService:
    def __init__(self, db: Session) -> None:
        self.repo = EvaluacionRepository(db)
        self.empleados = EmpleadoRepository(db)
        self.ciclos = CicloEvaluacionRepository(db)

    def crear(self, data: EvaluacionCreate) -> Evaluacion:
        if self.empleados.get_by_id(data.empleado_id) is None:
            raise EmpleadoNoEncontradoError()
        if self.ciclos.get_by_id(data.ciclo_id) is None:
            raise CicloEvaluacionNoEncontradoError()
        return self.repo.create(Evaluacion(**data.model_dump()))

    def listar_por_empleado(self, empleado_id: UUID) -> list[Evaluacion]:
        if self.empleados.get_by_id(empleado_id) is None:
            raise EmpleadoNoEncontradoError()
        return self.repo.list_by_empleado(empleado_id)


class DesempenoService:
    def __init__(self, db: Session) -> None:
        self.objetivos = ObjetivoService(db)
        self.evaluaciones = EvaluacionService(db)

    def historial(self, empleado_id: UUID) -> tuple[list[Objetivo], list[Evaluacion]]:
        objetivos = self.objetivos.listar_por_empleado(empleado_id)
        evaluaciones = self.evaluaciones.listar_por_empleado(empleado_id)
        return objetivos, evaluaciones
