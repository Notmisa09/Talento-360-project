from datetime import date
from uuid import UUID

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import require_role
from app.modules.asistencia.models import EstadoSolicitudEnum
from app.modules.asistencia.schemas import (
    AjustarSaldoVacacionesRequest,
    MarcajeEntradaRequest,
    MarcajeSalidaRequest,
    RechazarSolicitudRequest,
    RegistroAsistenciaOut,
    ResumenAsistenciaOut,
    SaldoVacacionesOut,
    SolicitudPermisoCreate,
    SolicitudPermisoOut,
)
from app.modules.asistencia.service import AsistenciaService
from app.modules.auth.models import RolEnum, Usuario

GESTION_RRHH = (RolEnum.ADMIN_RRHH.value, RolEnum.SUPERVISOR.value)

asistencia_router = APIRouter(prefix="/asistencia", tags=["Asistencia y Tiempo"])


@asistencia_router.post("/marcaje/entrada", response_model=RegistroAsistenciaOut, status_code=status.HTTP_201_CREATED)
def marcar_entrada(
    data: MarcajeEntradaRequest, db: Session = Depends(get_db), _: Usuario = Depends(require_role(*GESTION_RRHH))
):
    return AsistenciaService(db).marcar_entrada(data.empleado_id, data.origen)


@asistencia_router.post("/marcaje/salida", response_model=RegistroAsistenciaOut)
def marcar_salida(
    data: MarcajeSalidaRequest, db: Session = Depends(get_db), _: Usuario = Depends(require_role(*GESTION_RRHH))
):
    return AsistenciaService(db).marcar_salida(data.empleado_id)


@asistencia_router.get("/registros", response_model=list[RegistroAsistenciaOut])
def listar_registros(
    empleado_id: UUID = Query(...),
    desde: date | None = Query(None),
    hasta: date | None = Query(None),
    db: Session = Depends(get_db),
    _: Usuario = Depends(require_role(*GESTION_RRHH)),
):
    return AsistenciaService(db).listar_registros(empleado_id, desde, hasta)


@asistencia_router.get("/empleados/{empleado_id}/resumen", response_model=ResumenAsistenciaOut)
def resumen_mensual(
    empleado_id: UUID,
    mes: str = Query(..., pattern=r"^\d{4}-\d{2}$", description="Formato YYYY-MM"),
    db: Session = Depends(get_db),
    _: Usuario = Depends(require_role(*GESTION_RRHH)),
):
    return AsistenciaService(db).resumen_mensual(empleado_id, mes)


@asistencia_router.post("/permisos", response_model=SolicitudPermisoOut, status_code=status.HTTP_201_CREATED)
def crear_solicitud_permiso(
    data: SolicitudPermisoCreate, db: Session = Depends(get_db), _: Usuario = Depends(require_role(*GESTION_RRHH))
):
    return AsistenciaService(db).crear_solicitud_permiso(data)


@asistencia_router.get("/permisos", response_model=list[SolicitudPermisoOut])
def listar_solicitudes(
    empleado_id: UUID | None = Query(None),
    estado: EstadoSolicitudEnum | None = Query(None),
    db: Session = Depends(get_db),
    _: Usuario = Depends(require_role(*GESTION_RRHH)),
):
    return AsistenciaService(db).listar_solicitudes(empleado_id, estado)


@asistencia_router.patch("/permisos/{solicitud_id}/aprobar", response_model=SolicitudPermisoOut)
def aprobar_solicitud(
    solicitud_id: UUID,
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(require_role(*GESTION_RRHH)),
):
    return AsistenciaService(db).aprobar_solicitud(solicitud_id, usuario.id)


@asistencia_router.patch("/permisos/{solicitud_id}/rechazar", response_model=SolicitudPermisoOut)
def rechazar_solicitud(
    solicitud_id: UUID,
    data: RechazarSolicitudRequest,
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(require_role(*GESTION_RRHH)),
):
    return AsistenciaService(db).rechazar_solicitud(solicitud_id, usuario.id, data.motivo)


@asistencia_router.get("/vacaciones/{empleado_id}/saldo", response_model=SaldoVacacionesOut)
def obtener_saldo_vacaciones(
    empleado_id: UUID,
    anio: int = Query(default_factory=lambda: date.today().year),
    db: Session = Depends(get_db),
    _: Usuario = Depends(require_role(*GESTION_RRHH)),
):
    return AsistenciaService(db).obtener_o_crear_saldo(empleado_id, anio)


@asistencia_router.patch("/vacaciones/{empleado_id}/saldo", response_model=SaldoVacacionesOut)
def ajustar_saldo_vacaciones(
    empleado_id: UUID,
    data: AjustarSaldoVacacionesRequest,
    db: Session = Depends(get_db),
    _: Usuario = Depends(require_role(*GESTION_RRHH)),
):
    anio = data.anio or date.today().year
    return AsistenciaService(db).ajustar_saldo(empleado_id, data.dias_disponibles, anio)
