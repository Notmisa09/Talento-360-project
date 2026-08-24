from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, File, Form, Query, UploadFile, status
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import require_role
from app.modules.auth.models import RolEnum, Usuario
from app.modules.empleados.exceptions import ContratoNoEncontradoError
from app.modules.empleados.models import EstadoEmpleadoEnum, TipoDocumentoEnum
from app.modules.empleados.schemas import (
    CambiarEstadoEmpleadoRequest,
    ContratoCreate,
    ContratoOut,
    ContratoUpdate,
    DatosLegalesOut,
    DatosLegalesUpsert,
    DepartamentoCreate,
    DepartamentoOut,
    DepartamentoUpdate,
    DocumentoExpedienteOut,
    EmpleadoCreate,
    EmpleadoOut,
    EmpleadoUpdate,
    ExpedienteOut,
    PuestoCreate,
    PuestoOut,
    PuestoUpdate,
    SucursalCreate,
    SucursalOut,
    SucursalUpdate,
)
from app.modules.empleados.service import (
    DepartamentoService,
    EmpleadoService,
    PuestoService,
    SucursalService,
)
from app.shared.schemas import PaginatedResponse

GESTION_RRHH = (RolEnum.ADMIN_RRHH.value, RolEnum.SUPERVISOR.value)

sucursales_router = APIRouter(prefix="/sucursales", tags=["Sucursales"])
departamentos_router = APIRouter(prefix="/departamentos", tags=["Departamentos"])
puestos_router = APIRouter(prefix="/puestos", tags=["Puestos"])
empleados_router = APIRouter(prefix="/empleados", tags=["Empleados"])
contratos_router = APIRouter(prefix="/contratos", tags=["Contratos"])


@sucursales_router.post("", response_model=SucursalOut, status_code=status.HTTP_201_CREATED)
def crear_sucursal(
    data: SucursalCreate, db: Session = Depends(get_db), _: Usuario = Depends(require_role(*GESTION_RRHH))
):
    return SucursalService(db).crear(data)


@sucursales_router.get("", response_model=list[SucursalOut])
def listar_sucursales(db: Session = Depends(get_db), _: Usuario = Depends(require_role(*GESTION_RRHH))):
    return SucursalService(db).listar()


@sucursales_router.patch("/{sucursal_id}", response_model=SucursalOut)
def actualizar_sucursal(
    sucursal_id: UUID,
    data: SucursalUpdate,
    db: Session = Depends(get_db),
    _: Usuario = Depends(require_role(*GESTION_RRHH)),
):
    return SucursalService(db).actualizar(sucursal_id, data)


@departamentos_router.post("", response_model=DepartamentoOut, status_code=status.HTTP_201_CREATED)
def crear_departamento(
    data: DepartamentoCreate, db: Session = Depends(get_db), _: Usuario = Depends(require_role(*GESTION_RRHH))
):
    return DepartamentoService(db).crear(data)


@departamentos_router.get("", response_model=list[DepartamentoOut])
def listar_departamentos(db: Session = Depends(get_db), _: Usuario = Depends(require_role(*GESTION_RRHH))):
    return DepartamentoService(db).listar()


@departamentos_router.patch("/{departamento_id}", response_model=DepartamentoOut)
def actualizar_departamento(
    departamento_id: UUID,
    data: DepartamentoUpdate,
    db: Session = Depends(get_db),
    _: Usuario = Depends(require_role(*GESTION_RRHH)),
):
    return DepartamentoService(db).actualizar(departamento_id, data)


@puestos_router.post("", response_model=PuestoOut, status_code=status.HTTP_201_CREATED)
def crear_puesto(
    data: PuestoCreate, db: Session = Depends(get_db), _: Usuario = Depends(require_role(*GESTION_RRHH))
):
    return PuestoService(db).crear(data)


@puestos_router.get("", response_model=list[PuestoOut])
def listar_puestos(
    departamento_id: UUID | None = Query(None),
    db: Session = Depends(get_db),
    _: Usuario = Depends(require_role(*GESTION_RRHH)),
):
    return PuestoService(db).listar(departamento_id)


@puestos_router.patch("/{puesto_id}", response_model=PuestoOut)
def actualizar_puesto(
    puesto_id: UUID,
    data: PuestoUpdate,
    db: Session = Depends(get_db),
    _: Usuario = Depends(require_role(*GESTION_RRHH)),
):
    return PuestoService(db).actualizar(puesto_id, data)


@empleados_router.post("", response_model=EmpleadoOut, status_code=status.HTTP_201_CREATED)
def crear_empleado(
    data: EmpleadoCreate, db: Session = Depends(get_db), _: Usuario = Depends(require_role(*GESTION_RRHH))
):
    return EmpleadoService(db).crear(data)


@empleados_router.get("", response_model=PaginatedResponse[EmpleadoOut])
def listar_empleados(
    page: int = Query(1, ge=1),
    size: int = Query(20, ge=1, le=100),
    estado: EstadoEmpleadoEnum | None = Query(None),
    departamento_id: UUID | None = Query(None),
    q: str | None = Query(None),
    db: Session = Depends(get_db),
    _: Usuario = Depends(require_role(*GESTION_RRHH)),
):
    items, total, pages = EmpleadoService(db).listar(page, size, estado, departamento_id, q)
    return PaginatedResponse[EmpleadoOut](items=items, total=total, page=page, pages=pages)


@empleados_router.get("/{empleado_id}", response_model=EmpleadoOut)
def obtener_empleado(
    empleado_id: UUID, db: Session = Depends(get_db), _: Usuario = Depends(require_role(*GESTION_RRHH))
):
    return EmpleadoService(db).obtener(empleado_id)


@empleados_router.patch("/{empleado_id}", response_model=EmpleadoOut)
def actualizar_empleado(
    empleado_id: UUID,
    data: EmpleadoUpdate,
    db: Session = Depends(get_db),
    _: Usuario = Depends(require_role(*GESTION_RRHH)),
):
    return EmpleadoService(db).actualizar(empleado_id, data)


@empleados_router.patch("/{empleado_id}/estado", response_model=EmpleadoOut)
def cambiar_estado_empleado(
    empleado_id: UUID,
    body: CambiarEstadoEmpleadoRequest,
    db: Session = Depends(get_db),
    _: Usuario = Depends(require_role(*GESTION_RRHH)),
):
    return EmpleadoService(db).cambiar_estado(empleado_id, body.estado)


@empleados_router.get("/{empleado_id}/expediente", response_model=ExpedienteOut)
def obtener_expediente(
    empleado_id: UUID, db: Session = Depends(get_db), _: Usuario = Depends(require_role(*GESTION_RRHH))
):
    return EmpleadoService(db).obtener_expediente(empleado_id)


@empleados_router.put("/{empleado_id}/datos-legales", response_model=DatosLegalesOut)
def guardar_datos_legales(
    empleado_id: UUID,
    data: DatosLegalesUpsert,
    db: Session = Depends(get_db),
    _: Usuario = Depends(require_role(*GESTION_RRHH)),
):
    return EmpleadoService(db).guardar_datos_legales(empleado_id, data)


@empleados_router.post("/{empleado_id}/contratos", response_model=ContratoOut, status_code=status.HTTP_201_CREATED)
def crear_contrato(
    empleado_id: UUID,
    data: ContratoCreate,
    db: Session = Depends(get_db),
    _: Usuario = Depends(require_role(*GESTION_RRHH)),
):
    return EmpleadoService(db).crear_contrato(empleado_id, data)


@empleados_router.get("/{empleado_id}/contratos", response_model=list[ContratoOut])
def listar_contratos(
    empleado_id: UUID, db: Session = Depends(get_db), _: Usuario = Depends(require_role(*GESTION_RRHH))
):
    return EmpleadoService(db).listar_contratos(empleado_id)


@empleados_router.post(
    "/{empleado_id}/documentos", response_model=DocumentoExpedienteOut, status_code=status.HTTP_201_CREATED
)
async def cargar_documento(
    empleado_id: UUID,
    tipo: Annotated[TipoDocumentoEnum, Form()],
    archivo: Annotated[UploadFile, File()],
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(require_role(*GESTION_RRHH)),
):
    contenido = await archivo.read()
    return EmpleadoService(db).guardar_documento(
        empleado_id, tipo, archivo.filename or "documento", contenido, usuario.id
    )


@empleados_router.get("/{empleado_id}/documentos", response_model=list[DocumentoExpedienteOut])
def listar_documentos(
    empleado_id: UUID, db: Session = Depends(get_db), _: Usuario = Depends(require_role(*GESTION_RRHH))
):
    return EmpleadoService(db).listar_documentos(empleado_id)


@empleados_router.get("/{empleado_id}/documentos/{documento_id}/descargar")
def descargar_documento(
    empleado_id: UUID,
    documento_id: UUID,
    db: Session = Depends(get_db),
    _: Usuario = Depends(require_role(*GESTION_RRHH)),
) -> FileResponse:
    documento = EmpleadoService(db).obtener_documento(empleado_id, documento_id)
    return FileResponse(documento.url_archivo, filename=documento.nombre_archivo)


@contratos_router.get("/{contrato_id}", response_model=ContratoOut)
def obtener_contrato(
    contrato_id: UUID, db: Session = Depends(get_db), _: Usuario = Depends(require_role(*GESTION_RRHH))
):
    servicio = EmpleadoService(db)
    contrato = servicio.contratos.get_by_id(contrato_id)
    if contrato is None:
        raise ContratoNoEncontradoError()
    return contrato


@contratos_router.patch("/{contrato_id}", response_model=ContratoOut)
def actualizar_contrato(
    contrato_id: UUID,
    data: ContratoUpdate,
    db: Session = Depends(get_db),
    _: Usuario = Depends(require_role(*GESTION_RRHH)),
):
    return EmpleadoService(db).actualizar_contrato(contrato_id, data)
