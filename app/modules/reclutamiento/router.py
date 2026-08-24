from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, File, Form, Query, UploadFile, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import require_role
from app.modules.auth.models import RolEnum, Usuario
from app.modules.empleados.schemas import EmpleadoOut
from app.modules.reclutamiento.models import EstadoPostulacionEnum, EstadoVacanteEnum
from app.modules.reclutamiento.schemas import (
    CambiarEstadoPostulacionRequest,
    CandidatoCreate,
    CandidatoOut,
    ContratarPostulacionRequest,
    EntrevistaActualizar,
    EntrevistaCreate,
    EntrevistaOut,
    PostulacionCreate,
    PostulacionOut,
    RechazarPostulacionRequest,
    VacanteCreate,
    VacanteOut,
)
from app.modules.reclutamiento.service import CandidatoService, PostulacionService, VacanteService
from app.shared.schemas import PaginatedResponse

GESTION_RRHH = (RolEnum.ADMIN_RRHH.value, RolEnum.SUPERVISOR.value)

vacantes_router = APIRouter(prefix="/vacantes", tags=["Reclutamiento - Vacantes"])
candidatos_router = APIRouter(prefix="/candidatos", tags=["Reclutamiento - Candidatos"])
postulaciones_router = APIRouter(prefix="/postulaciones", tags=["Reclutamiento - Postulaciones"])
entrevistas_router = APIRouter(prefix="/entrevistas", tags=["Reclutamiento - Entrevistas"])


@vacantes_router.post("", response_model=VacanteOut, status_code=status.HTTP_201_CREATED)
def crear_vacante(
    data: VacanteCreate, db: Session = Depends(get_db), _: Usuario = Depends(require_role(*GESTION_RRHH))
):
    return VacanteService(db).crear(data)


@vacantes_router.get("", response_model=PaginatedResponse[VacanteOut])
def listar_vacantes(
    page: int = Query(1, ge=1),
    size: int = Query(20, ge=1, le=100),
    estado: EstadoVacanteEnum | None = Query(None),
    departamento_id: UUID | None = Query(None),
    db: Session = Depends(get_db),
    _: Usuario = Depends(require_role(*GESTION_RRHH)),
):
    items, total, pages = VacanteService(db).listar(page, size, estado, departamento_id)
    return PaginatedResponse[VacanteOut](items=items, total=total, page=page, pages=pages)


@vacantes_router.get("/{vacante_id}", response_model=VacanteOut)
def obtener_vacante(
    vacante_id: UUID, db: Session = Depends(get_db), _: Usuario = Depends(require_role(*GESTION_RRHH))
):
    return VacanteService(db).obtener(vacante_id)


@vacantes_router.post("/{vacante_id}/publicar", response_model=VacanteOut)
def publicar_vacante(
    vacante_id: UUID, db: Session = Depends(get_db), _: Usuario = Depends(require_role(*GESTION_RRHH))
):
    return VacanteService(db).publicar(vacante_id)


@vacantes_router.post("/{vacante_id}/cerrar", response_model=VacanteOut)
def cerrar_vacante(
    vacante_id: UUID, db: Session = Depends(get_db), _: Usuario = Depends(require_role(*GESTION_RRHH))
):
    return VacanteService(db).cerrar(vacante_id)


@vacantes_router.post(
    "/{vacante_id}/postulaciones", response_model=PostulacionOut, status_code=status.HTTP_201_CREATED
)
def postular_candidato(
    vacante_id: UUID,
    data: PostulacionCreate,
    db: Session = Depends(get_db),
    _: Usuario = Depends(require_role(*GESTION_RRHH)),
):
    return PostulacionService(db).postular(vacante_id, data.candidato_id)


@vacantes_router.get("/{vacante_id}/postulaciones", response_model=list[PostulacionOut])
def listar_postulaciones_de_vacante(
    vacante_id: UUID, db: Session = Depends(get_db), _: Usuario = Depends(require_role(*GESTION_RRHH))
):
    return PostulacionService(db).listar_por_vacante(vacante_id)


@candidatos_router.post("", response_model=CandidatoOut, status_code=status.HTTP_201_CREATED)
async def registrar_candidato(
    nombres: Annotated[str, Form()],
    apellidos: Annotated[str, Form()],
    email: Annotated[str, Form()],
    telefono: Annotated[str | None, Form()] = None,
    linkedin: Annotated[str | None, Form()] = None,
    cv: Annotated[UploadFile | None, File()] = None,
    db: Session = Depends(get_db),
    _: Usuario = Depends(require_role(*GESTION_RRHH)),
):
    servicio = CandidatoService(db)
    candidato = servicio.crear(
        CandidatoCreate(nombres=nombres, apellidos=apellidos, email=email, telefono=telefono, linkedin=linkedin)
    )
    if cv is not None:
        contenido = await cv.read()
        candidato = servicio.guardar_cv(candidato.id, cv.filename or "cv", contenido)
    return candidato


@candidatos_router.get("", response_model=PaginatedResponse[CandidatoOut])
def listar_candidatos(
    page: int = Query(1, ge=1),
    size: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
    _: Usuario = Depends(require_role(*GESTION_RRHH)),
):
    items, total, pages = CandidatoService(db).listar(page, size)
    return PaginatedResponse[CandidatoOut](items=items, total=total, page=page, pages=pages)


@candidatos_router.get("/{candidato_id}", response_model=CandidatoOut)
def obtener_candidato(
    candidato_id: UUID, db: Session = Depends(get_db), _: Usuario = Depends(require_role(*GESTION_RRHH))
):
    return CandidatoService(db).obtener(candidato_id)


@postulaciones_router.patch("/{postulacion_id}/estado", response_model=PostulacionOut)
def cambiar_estado_postulacion(
    postulacion_id: UUID,
    body: CambiarEstadoPostulacionRequest,
    db: Session = Depends(get_db),
    _: Usuario = Depends(require_role(*GESTION_RRHH)),
):
    return PostulacionService(db).cambiar_estado(postulacion_id, body.estado)


@postulaciones_router.post("/{postulacion_id}/rechazar", response_model=PostulacionOut)
def rechazar_postulacion(
    postulacion_id: UUID,
    body: RechazarPostulacionRequest,
    db: Session = Depends(get_db),
    _: Usuario = Depends(require_role(*GESTION_RRHH)),
):
    return PostulacionService(db).rechazar(postulacion_id, body.motivo)


@postulaciones_router.post(
    "/{postulacion_id}/entrevistas", response_model=EntrevistaOut, status_code=status.HTTP_201_CREATED
)
def agendar_entrevista(
    postulacion_id: UUID,
    data: EntrevistaCreate,
    db: Session = Depends(get_db),
    _: Usuario = Depends(require_role(*GESTION_RRHH)),
):
    return PostulacionService(db).agendar_entrevista(postulacion_id, data)


@postulaciones_router.get("/{postulacion_id}/entrevistas", response_model=list[EntrevistaOut])
def listar_entrevistas(
    postulacion_id: UUID, db: Session = Depends(get_db), _: Usuario = Depends(require_role(*GESTION_RRHH))
):
    return PostulacionService(db).listar_entrevistas(postulacion_id)


@postulaciones_router.post("/{postulacion_id}/contratar", response_model=EmpleadoOut, status_code=status.HTTP_201_CREATED)
def contratar_postulacion(
    postulacion_id: UUID,
    data: ContratarPostulacionRequest,
    db: Session = Depends(get_db),
    _: Usuario = Depends(require_role(*GESTION_RRHH)),
):
    return PostulacionService(db).contratar(postulacion_id, data)


@entrevistas_router.patch("/{entrevista_id}", response_model=EntrevistaOut)
def actualizar_entrevista(
    entrevista_id: UUID,
    data: EntrevistaActualizar,
    db: Session = Depends(get_db),
    _: Usuario = Depends(require_role(*GESTION_RRHH)),
):
    return PostulacionService(db).actualizar_entrevista(entrevista_id, data)
