import math
import uuid
from pathlib import Path
from uuid import UUID

from sqlalchemy.orm import Session

from app.core.config import settings
from app.modules.empleados.exceptions import (
    CedulaYaRegistradaError,
    ContratoNoEncontradoError,
    DepartamentoNoEncontradoError,
    DocumentoNoEncontradoError,
    EmpleadoNoEncontradoError,
    PuestoNoEncontradoError,
    SucursalNoEncontradaError,
    UsuarioYaVinculadoError,
)
from app.modules.empleados.models import (
    Contrato,
    DatosLegales,
    Departamento,
    DocumentoExpediente,
    Empleado,
    EstadoEmpleadoEnum,
    Puesto,
    Sucursal,
    TipoDocumentoEnum,
)
from app.modules.empleados.repository import (
    ContratoRepository,
    DatosLegalesRepository,
    DepartamentoRepository,
    DocumentoExpedienteRepository,
    EmpleadoRepository,
    PuestoRepository,
    SucursalRepository,
)
from app.modules.empleados.schemas import (
    ContratoCreate,
    ContratoUpdate,
    DatosLegalesUpsert,
    DepartamentoCreate,
    DepartamentoUpdate,
    EmpleadoCreate,
    EmpleadoUpdate,
    ExpedienteOut,
    PuestoCreate,
    PuestoUpdate,
    SucursalCreate,
    SucursalUpdate,
)


class SucursalService:
    def __init__(self, db: Session) -> None:
        self.repo = SucursalRepository(db)

    def crear(self, data: SucursalCreate) -> Sucursal:
        return self.repo.create(Sucursal(**data.model_dump()))

    def listar(self) -> list[Sucursal]:
        return self.repo.list()

    def obtener(self, sucursal_id: UUID) -> Sucursal:
        sucursal = self.repo.get_by_id(sucursal_id)
        if sucursal is None:
            raise SucursalNoEncontradaError()
        return sucursal

    def actualizar(self, sucursal_id: UUID, data: SucursalUpdate) -> Sucursal:
        sucursal = self.obtener(sucursal_id)
        for campo, valor in data.model_dump(exclude_unset=True).items():
            setattr(sucursal, campo, valor)
        return self.repo.save(sucursal)


class DepartamentoService:
    def __init__(self, db: Session) -> None:
        self.repo = DepartamentoRepository(db)

    def crear(self, data: DepartamentoCreate) -> Departamento:
        return self.repo.create(Departamento(**data.model_dump()))

    def listar(self) -> list[Departamento]:
        return self.repo.list()

    def obtener(self, departamento_id: UUID) -> Departamento:
        departamento = self.repo.get_by_id(departamento_id)
        if departamento is None:
            raise DepartamentoNoEncontradoError()
        return departamento

    def actualizar(self, departamento_id: UUID, data: DepartamentoUpdate) -> Departamento:
        departamento = self.obtener(departamento_id)
        for campo, valor in data.model_dump(exclude_unset=True).items():
            setattr(departamento, campo, valor)
        return self.repo.save(departamento)


class PuestoService:
    def __init__(self, db: Session) -> None:
        self.repo = PuestoRepository(db)
        self.departamentos = DepartamentoRepository(db)

    def crear(self, data: PuestoCreate) -> Puesto:
        if self.departamentos.get_by_id(data.departamento_id) is None:
            raise DepartamentoNoEncontradoError()
        return self.repo.create(Puesto(**data.model_dump()))

    def listar(self, departamento_id: UUID | None = None) -> list[Puesto]:
        return self.repo.list(departamento_id)

    def obtener(self, puesto_id: UUID) -> Puesto:
        puesto = self.repo.get_by_id(puesto_id)
        if puesto is None:
            raise PuestoNoEncontradoError()
        return puesto

    def actualizar(self, puesto_id: UUID, data: PuestoUpdate) -> Puesto:
        puesto = self.obtener(puesto_id)
        cambios = data.model_dump(exclude_unset=True)
        if "departamento_id" in cambios and self.departamentos.get_by_id(cambios["departamento_id"]) is None:
            raise DepartamentoNoEncontradoError()
        for campo, valor in cambios.items():
            setattr(puesto, campo, valor)
        return self.repo.save(puesto)


class EmpleadoService:
    def __init__(self, db: Session) -> None:
        self.repo = EmpleadoRepository(db)
        self.sucursales = SucursalRepository(db)
        self.departamentos = DepartamentoRepository(db)
        self.puestos = PuestoRepository(db)
        self.contratos = ContratoRepository(db)
        self.documentos = DocumentoExpedienteRepository(db)
        self.datos_legales = DatosLegalesRepository(db)

    def _generar_codigo_empleado(self) -> str:
        siguiente = self.repo.count() + 1
        return f"EMP-{siguiente:05d}"

    def crear(self, data: EmpleadoCreate) -> Empleado:
        if self.repo.get_by_cedula(data.cedula_o_dni) is not None:
            raise CedulaYaRegistradaError()
        if self.sucursales.get_by_id(data.sucursal_id) is None:
            raise SucursalNoEncontradaError()
        if self.departamentos.get_by_id(data.departamento_id) is None:
            raise DepartamentoNoEncontradoError()
        if self.puestos.get_by_id(data.puesto_id) is None:
            raise PuestoNoEncontradoError()
        if data.usuario_id is not None and self.repo.get_by_usuario_id(data.usuario_id) is not None:
            raise UsuarioYaVinculadoError()

        empleado = Empleado(codigo_empleado=self._generar_codigo_empleado(), **data.model_dump())
        return self.repo.create(empleado)

    def listar(
        self,
        page: int,
        size: int,
        estado: EstadoEmpleadoEnum | None,
        departamento_id: UUID | None,
        q: str | None,
    ) -> tuple[list[Empleado], int, int]:
        items, total = self.repo.list(page, size, estado, departamento_id, q)
        pages = math.ceil(total / size) if total else 0
        return items, total, pages

    def obtener(self, empleado_id: UUID) -> Empleado:
        empleado = self.repo.get_by_id(empleado_id)
        if empleado is None:
            raise EmpleadoNoEncontradoError()
        return empleado

    def actualizar(self, empleado_id: UUID, data: EmpleadoUpdate) -> Empleado:
        empleado = self.obtener(empleado_id)
        cambios = data.model_dump(exclude_unset=True)
        if "sucursal_id" in cambios and self.sucursales.get_by_id(cambios["sucursal_id"]) is None:
            raise SucursalNoEncontradaError()
        if "departamento_id" in cambios and self.departamentos.get_by_id(cambios["departamento_id"]) is None:
            raise DepartamentoNoEncontradoError()
        if "puesto_id" in cambios and self.puestos.get_by_id(cambios["puesto_id"]) is None:
            raise PuestoNoEncontradoError()
        if "usuario_id" in cambios and cambios["usuario_id"] is not None:
            vinculado = self.repo.get_by_usuario_id(cambios["usuario_id"])
            if vinculado is not None and vinculado.id != empleado.id:
                raise UsuarioYaVinculadoError()
        for campo, valor in cambios.items():
            setattr(empleado, campo, valor)
        return self.repo.save(empleado)

    def cambiar_estado(self, empleado_id: UUID, estado: EstadoEmpleadoEnum) -> Empleado:
        empleado = self.obtener(empleado_id)
        empleado.estado = estado
        return self.repo.save(empleado)

    def crear_contrato(self, empleado_id: UUID, data: ContratoCreate) -> Contrato:
        empleado = self.obtener(empleado_id)
        contrato = Contrato(empleado_id=empleado.id, **data.model_dump())
        return self.contratos.create(contrato)

    def listar_contratos(self, empleado_id: UUID) -> list[Contrato]:
        self.obtener(empleado_id)
        return self.contratos.list_by_empleado(empleado_id)

    def actualizar_contrato(self, contrato_id: UUID, data: ContratoUpdate) -> Contrato:
        contrato = self.contratos.get_by_id(contrato_id)
        if contrato is None:
            raise ContratoNoEncontradoError()
        for campo, valor in data.model_dump(exclude_unset=True).items():
            setattr(contrato, campo, valor)
        return self.contratos.save(contrato)

    def guardar_datos_legales(self, empleado_id: UUID, data: DatosLegalesUpsert) -> DatosLegales:
        self.obtener(empleado_id)
        existentes = self.datos_legales.get_by_empleado(empleado_id)
        if existentes is None:
            return self.datos_legales.create(DatosLegales(empleado_id=empleado_id, **data.model_dump()))
        for campo, valor in data.model_dump(exclude_unset=True).items():
            setattr(existentes, campo, valor)
        return self.datos_legales.save(existentes)

    def guardar_documento(
        self,
        empleado_id: UUID,
        tipo: TipoDocumentoEnum,
        nombre_archivo: str,
        contenido: bytes,
        cargado_por: UUID | None,
    ) -> DocumentoExpediente:
        self.obtener(empleado_id)
        directorio = Path(settings.STORAGE_DIR) / "expedientes" / str(empleado_id)
        directorio.mkdir(parents=True, exist_ok=True)
        nombre_unico = f"{uuid.uuid4().hex}_{nombre_archivo}"
        ruta = directorio / nombre_unico
        ruta.write_bytes(contenido)

        documento = DocumentoExpediente(
            empleado_id=empleado_id,
            tipo=tipo,
            nombre_archivo=nombre_archivo,
            url_archivo=str(ruta),
            cargado_por=cargado_por,
        )
        return self.documentos.create(documento)

    def listar_documentos(self, empleado_id: UUID) -> list[DocumentoExpediente]:
        self.obtener(empleado_id)
        return self.documentos.list_by_empleado(empleado_id)

    def obtener_documento(self, empleado_id: UUID, documento_id: UUID) -> DocumentoExpediente:
        documento = self.documentos.get_by_id(documento_id)
        if documento is None or documento.empleado_id != empleado_id:
            raise DocumentoNoEncontradoError()
        return documento

    def obtener_expediente(self, empleado_id: UUID) -> ExpedienteOut:
        empleado = self.obtener(empleado_id)
        contratos = self.contratos.list_by_empleado(empleado_id)
        documentos = self.documentos.list_by_empleado(empleado_id)
        datos_legales = self.datos_legales.get_by_empleado(empleado_id)
        return ExpedienteOut(
            empleado=empleado,
            contratos=contratos,
            documentos=documentos,
            datos_legales=datos_legales,
            antiguedad_anios=empleado.calcular_antiguedad(),
        )
