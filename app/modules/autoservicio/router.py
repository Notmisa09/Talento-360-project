from io import BytesIO
from uuid import UUID

from fastapi import APIRouter, Depends, Query, status
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import get_current_user
from app.modules.asistencia.schemas import SaldoVacacionesOut, SolicitudPermisoOut
from app.modules.auth.models import Usuario
from app.modules.autoservicio.schemas import SolicitarPermisoRequest
from app.modules.autoservicio.service import AutoservicioService
from app.modules.capacitacion.schemas import InscripcionOut
from app.modules.desempeno.schemas import EvaluacionOut
from app.modules.empleados.schemas import EmpleadoOut
from app.modules.nomina.schemas import NominaOut

autoservicio_router = APIRouter(prefix="/autoservicio", tags=["Autoservicio (ESS)"])


@autoservicio_router.get("/mi-perfil", response_model=EmpleadoOut)
def mi_perfil(db: Session = Depends(get_db), usuario: Usuario = Depends(get_current_user)):
    return AutoservicioService(db).mi_perfil(usuario.id)


@autoservicio_router.get("/mis-volantes-pago", response_model=list[NominaOut])
def mis_volantes_pago(db: Session = Depends(get_db), usuario: Usuario = Depends(get_current_user)):
    return AutoservicioService(db).mis_volantes_pago(usuario.id)


@autoservicio_router.get("/mis-volantes-pago/{nomina_id}/descargar")
def descargar_volante(
    nomina_id: UUID, db: Session = Depends(get_db), usuario: Usuario = Depends(get_current_user)
) -> StreamingResponse:
    pdf_bytes = AutoservicioService(db).descargar_volante(usuario.id, nomina_id)
    return StreamingResponse(
        BytesIO(pdf_bytes),
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename=volante_{nomina_id}.pdf"},
    )


@autoservicio_router.post("/mis-permisos", response_model=SolicitudPermisoOut, status_code=status.HTTP_201_CREATED)
def solicitar_permiso(
    data: SolicitarPermisoRequest, db: Session = Depends(get_db), usuario: Usuario = Depends(get_current_user)
):
    return AutoservicioService(db).solicitar_permiso(usuario.id, data)


@autoservicio_router.get("/mis-permisos", response_model=list[SolicitudPermisoOut])
def mis_permisos(db: Session = Depends(get_db), usuario: Usuario = Depends(get_current_user)):
    return AutoservicioService(db).mis_permisos(usuario.id)


@autoservicio_router.get("/mi-saldo-vacaciones", response_model=SaldoVacacionesOut)
def mi_saldo_vacaciones(
    anio: int | None = Query(None), db: Session = Depends(get_db), usuario: Usuario = Depends(get_current_user)
):
    return AutoservicioService(db).mi_saldo_vacaciones(usuario.id, anio)


@autoservicio_router.get("/mis-cursos", response_model=list[InscripcionOut])
def mis_cursos(db: Session = Depends(get_db), usuario: Usuario = Depends(get_current_user)):
    return AutoservicioService(db).mis_cursos(usuario.id)


@autoservicio_router.get("/mis-evaluaciones", response_model=list[EvaluacionOut])
def mis_evaluaciones(db: Session = Depends(get_db), usuario: Usuario = Depends(get_current_user)):
    return AutoservicioService(db).mis_evaluaciones(usuario.id)
