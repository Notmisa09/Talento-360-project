from uuid import UUID

from fastapi import APIRouter, Depends, status
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import require_role
from app.modules.auth.models import RolEnum, Usuario
from app.modules.capacitacion.schemas import (
    ActualizarProgresoRequest,
    CursoCreate,
    CursoOut,
    InscribirEmpleadoRequest,
    InscripcionOut,
)
from app.modules.capacitacion.service import CursoService, InscripcionService

GESTION_RRHH = (RolEnum.ADMIN_RRHH.value, RolEnum.SUPERVISOR.value)

cursos_router = APIRouter(prefix="/capacitacion/cursos", tags=["Capacitacion - Cursos"])
inscripciones_router = APIRouter(prefix="/capacitacion/inscripciones", tags=["Capacitacion - Inscripciones"])
capacitacion_router = APIRouter(prefix="/capacitacion", tags=["Capacitacion"])


@cursos_router.post("", response_model=CursoOut, status_code=status.HTTP_201_CREATED)
def crear_curso(data: CursoCreate, db: Session = Depends(get_db), _: Usuario = Depends(require_role(*GESTION_RRHH))):
    return CursoService(db).crear(data)


@cursos_router.get("", response_model=list[CursoOut])
def listar_cursos(db: Session = Depends(get_db), _: Usuario = Depends(require_role(*GESTION_RRHH))):
    return CursoService(db).listar()


@cursos_router.post("/{curso_id}/inscribir", response_model=InscripcionOut, status_code=status.HTTP_201_CREATED)
def inscribir_empleado(
    curso_id: UUID,
    data: InscribirEmpleadoRequest,
    db: Session = Depends(get_db),
    _: Usuario = Depends(require_role(*GESTION_RRHH)),
):
    return InscripcionService(db).inscribir(curso_id, data.empleado_id)


@cursos_router.get("/{curso_id}/inscripciones", response_model=list[InscripcionOut])
def listar_inscripciones_de_curso(
    curso_id: UUID, db: Session = Depends(get_db), _: Usuario = Depends(require_role(*GESTION_RRHH))
):
    return InscripcionService(db).listar_por_curso(curso_id)


@inscripciones_router.patch("/{inscripcion_id}/progreso", response_model=InscripcionOut)
def actualizar_progreso(
    inscripcion_id: UUID,
    data: ActualizarProgresoRequest,
    db: Session = Depends(get_db),
    _: Usuario = Depends(require_role(*GESTION_RRHH)),
):
    return InscripcionService(db).actualizar_progreso(inscripcion_id, data.progreso)


@inscripciones_router.get("/{inscripcion_id}/certificado/descargar")
def descargar_certificado(
    inscripcion_id: UUID, db: Session = Depends(get_db), _: Usuario = Depends(require_role(*GESTION_RRHH))
) -> FileResponse:
    ruta = InscripcionService(db).obtener_ruta_certificado(inscripcion_id)
    return FileResponse(ruta, media_type="application/pdf", filename=f"certificado_{inscripcion_id}.pdf")


@capacitacion_router.get("/empleados/{empleado_id}/certificados", response_model=list[InscripcionOut])
def listar_certificados_de_empleado(
    empleado_id: UUID, db: Session = Depends(get_db), _: Usuario = Depends(require_role(*GESTION_RRHH))
):
    return InscripcionService(db).listar_certificados_de_empleado(empleado_id)
