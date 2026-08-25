from uuid import UUID

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import require_role
from app.modules.auth.models import RolEnum, Usuario
from app.modules.desempeno.schemas import (
    CicloEvaluacionCreate,
    CicloEvaluacionOut,
    EvaluacionCreate,
    EvaluacionOut,
    HistorialDesempenoOut,
    ObjetivoAvanceRequest,
    ObjetivoCreate,
    ObjetivoOut,
)
from app.modules.desempeno.service import (
    CicloEvaluacionService,
    DesempenoService,
    EvaluacionService,
    ObjetivoService,
)

GESTION_RRHH = (RolEnum.ADMIN_RRHH.value, RolEnum.SUPERVISOR.value)

ciclos_evaluacion_router = APIRouter(prefix="/ciclos-evaluacion", tags=["Desempeno - Ciclos"])
objetivos_router = APIRouter(prefix="/objetivos", tags=["Desempeno - Objetivos"])
evaluaciones_router = APIRouter(prefix="/evaluaciones", tags=["Desempeno - Evaluaciones"])
desempeno_router = APIRouter(prefix="/desempeno", tags=["Desempeno"])


@ciclos_evaluacion_router.post("", response_model=CicloEvaluacionOut, status_code=status.HTTP_201_CREATED)
def crear_ciclo(
    data: CicloEvaluacionCreate, db: Session = Depends(get_db), _: Usuario = Depends(require_role(*GESTION_RRHH))
):
    return CicloEvaluacionService(db).crear(data)


@ciclos_evaluacion_router.get("", response_model=list[CicloEvaluacionOut])
def listar_ciclos(db: Session = Depends(get_db), _: Usuario = Depends(require_role(*GESTION_RRHH))):
    return CicloEvaluacionService(db).listar()


@objetivos_router.post("", response_model=ObjetivoOut, status_code=status.HTTP_201_CREATED)
def crear_objetivo(
    data: ObjetivoCreate, db: Session = Depends(get_db), _: Usuario = Depends(require_role(*GESTION_RRHH))
):
    return ObjetivoService(db).crear(data)


@objetivos_router.get("", response_model=list[ObjetivoOut])
def listar_objetivos(
    empleado_id: UUID = Query(...),
    db: Session = Depends(get_db),
    _: Usuario = Depends(require_role(*GESTION_RRHH)),
):
    return ObjetivoService(db).listar_por_empleado(empleado_id)


@objetivos_router.patch("/{objetivo_id}/avance", response_model=ObjetivoOut)
def actualizar_avance_objetivo(
    objetivo_id: UUID,
    body: ObjetivoAvanceRequest,
    db: Session = Depends(get_db),
    _: Usuario = Depends(require_role(*GESTION_RRHH)),
):
    return ObjetivoService(db).actualizar_avance(objetivo_id, body.valor_actual)


@evaluaciones_router.post("", response_model=EvaluacionOut, status_code=status.HTTP_201_CREATED)
def crear_evaluacion(
    data: EvaluacionCreate, db: Session = Depends(get_db), _: Usuario = Depends(require_role(*GESTION_RRHH))
):
    return EvaluacionService(db).crear(data)


@evaluaciones_router.get("", response_model=list[EvaluacionOut])
def listar_evaluaciones(
    empleado_id: UUID = Query(...),
    db: Session = Depends(get_db),
    _: Usuario = Depends(require_role(*GESTION_RRHH)),
):
    return EvaluacionService(db).listar_por_empleado(empleado_id)


@desempeno_router.get("/empleados/{empleado_id}/historial-desempeno", response_model=HistorialDesempenoOut)
def historial_desempeno(
    empleado_id: UUID, db: Session = Depends(get_db), _: Usuario = Depends(require_role(*GESTION_RRHH))
):
    objetivos, evaluaciones = DesempenoService(db).historial(empleado_id)
    return HistorialDesempenoOut(objetivos=objetivos, evaluaciones=evaluaciones)
