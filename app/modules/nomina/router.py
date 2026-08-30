from io import BytesIO
from uuid import UUID

from fastapi import APIRouter, Depends, status
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import require_role
from app.modules.auth.models import RolEnum, Usuario
from app.modules.nomina.schemas import (
    ConceptoNominaOut,
    NominaDetalleOut,
    NominaOut,
    PeriodoNominaCreate,
    PeriodoNominaOut,
    ProcesarPeriodoResultadoOut,
)
from app.modules.nomina.service import NominaService, PeriodoNominaService

GESTION_RRHH = (RolEnum.ADMIN_RRHH.value, RolEnum.SUPERVISOR.value)

periodos_nomina_router = APIRouter(prefix="/nomina/periodos", tags=["Nomina - Periodos"])
nominas_router = APIRouter(prefix="/nomina", tags=["Nomina"])


@periodos_nomina_router.post("", response_model=PeriodoNominaOut, status_code=status.HTTP_201_CREATED)
def crear_periodo(
    data: PeriodoNominaCreate, db: Session = Depends(get_db), _: Usuario = Depends(require_role(*GESTION_RRHH))
):
    return PeriodoNominaService(db).crear(data)


@periodos_nomina_router.get("", response_model=list[PeriodoNominaOut])
def listar_periodos(db: Session = Depends(get_db), _: Usuario = Depends(require_role(*GESTION_RRHH))):
    return PeriodoNominaService(db).listar()


@periodos_nomina_router.post("/{periodo_id}/procesar", response_model=ProcesarPeriodoResultadoOut)
def procesar_periodo(
    periodo_id: UUID, db: Session = Depends(get_db), _: Usuario = Depends(require_role(*GESTION_RRHH))
):
    periodo, nominas_generadas = NominaService(db).procesar_periodo(periodo_id)
    return ProcesarPeriodoResultadoOut(periodo=PeriodoNominaOut.model_validate(periodo), nominas_generadas=nominas_generadas)


@periodos_nomina_router.post("/{periodo_id}/cerrar", response_model=PeriodoNominaOut)
def cerrar_periodo(periodo_id: UUID, db: Session = Depends(get_db), _: Usuario = Depends(require_role(*GESTION_RRHH))):
    return PeriodoNominaService(db).cerrar(periodo_id)


@nominas_router.get("/empleados/{empleado_id}/nominas", response_model=list[NominaOut])
def listar_nominas_de_empleado(
    empleado_id: UUID, db: Session = Depends(get_db), _: Usuario = Depends(require_role(*GESTION_RRHH))
):
    return NominaService(db).listar_por_empleado(empleado_id)


@nominas_router.get("/nominas/{nomina_id}", response_model=NominaDetalleOut)
def obtener_nomina(nomina_id: UUID, db: Session = Depends(get_db), _: Usuario = Depends(require_role(*GESTION_RRHH))):
    nomina, conceptos = NominaService(db).obtener_con_conceptos(nomina_id)
    return NominaDetalleOut(
        **NominaOut.model_validate(nomina).model_dump(),
        conceptos=[ConceptoNominaOut.model_validate(c) for c in conceptos],
    )


@nominas_router.get("/nominas/{nomina_id}/volante")
def descargar_volante(
    nomina_id: UUID, db: Session = Depends(get_db), _: Usuario = Depends(require_role(*GESTION_RRHH))
) -> StreamingResponse:
    pdf_bytes = NominaService(db).generar_volante_pdf(nomina_id)
    return StreamingResponse(
        BytesIO(pdf_bytes),
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename=volante_{nomina_id}.pdf"},
    )
