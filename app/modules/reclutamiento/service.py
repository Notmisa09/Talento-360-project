import math
import uuid
from pathlib import Path
from uuid import UUID

from sqlalchemy.orm import Session

from app.core.config import settings
from app.modules.empleados.models import Empleado
from app.modules.empleados.schemas import ContratoCreate, EmpleadoCreate
from app.modules.empleados.service import EmpleadoService
from app.modules.reclutamiento.exceptions import (
    CandidatoNoEncontradoError,
    EmailYaRegistradoComoCandidatoError,
    EntrevistaNoEncontradaError,
    PostulacionNoEncontradaError,
    PostulacionYaExisteError,
    VacanteNoEncontradaError,
    VacanteNoPublicadaError,
)
from app.modules.reclutamiento.models import (
    Candidato,
    Entrevista,
    EstadoPostulacionEnum,
    EstadoVacanteEnum,
    Postulacion,
    Vacante,
)
from app.modules.reclutamiento.repository import (
    CandidatoRepository,
    EntrevistaRepository,
    PostulacionRepository,
    VacanteRepository,
)
from app.modules.reclutamiento.schemas import (
    CandidatoCreate,
    ContratarPostulacionRequest,
    EntrevistaActualizar,
    EntrevistaCreate,
    VacanteCreate,
)


class VacanteService:
    def __init__(self, db: Session) -> None:
        self.repo = VacanteRepository(db)

    def crear(self, data: VacanteCreate) -> Vacante:
        return self.repo.create(Vacante(**data.model_dump()))

    def listar(
        self, page: int, size: int, estado: EstadoVacanteEnum | None, departamento_id: UUID | None
    ) -> tuple[list[Vacante], int, int]:
        items, total = self.repo.list(page, size, estado, departamento_id)
        pages = math.ceil(total / size) if total else 0
        return items, total, pages

    def obtener(self, vacante_id: UUID) -> Vacante:
        vacante = self.repo.get_by_id(vacante_id)
        if vacante is None:
            raise VacanteNoEncontradaError()
        return vacante

    def publicar(self, vacante_id: UUID) -> Vacante:
        vacante = self.obtener(vacante_id)
        vacante.publicar()
        return self.repo.save(vacante)

    def cerrar(self, vacante_id: UUID) -> Vacante:
        vacante = self.obtener(vacante_id)
        vacante.cerrar()
        return self.repo.save(vacante)


class CandidatoService:
    def __init__(self, db: Session) -> None:
        self.repo = CandidatoRepository(db)

    def crear(self, data: CandidatoCreate) -> Candidato:
        if self.repo.get_by_email(data.email) is not None:
            raise EmailYaRegistradoComoCandidatoError()
        return self.repo.create(Candidato(**data.model_dump()))

    def guardar_cv(self, candidato_id: UUID, nombre_archivo: str, contenido: bytes) -> Candidato:
        candidato = self.obtener(candidato_id)
        directorio = Path(settings.STORAGE_DIR) / "candidatos" / str(candidato_id)
        directorio.mkdir(parents=True, exist_ok=True)
        ruta = directorio / f"{uuid.uuid4().hex}_{nombre_archivo}"
        ruta.write_bytes(contenido)
        candidato.cv_url = str(ruta)
        return self.repo.save(candidato)

    def listar(self, page: int, size: int) -> tuple[list[Candidato], int, int]:
        items, total = self.repo.list(page, size)
        pages = math.ceil(total / size) if total else 0
        return items, total, pages

    def obtener(self, candidato_id: UUID) -> Candidato:
        candidato = self.repo.get_by_id(candidato_id)
        if candidato is None:
            raise CandidatoNoEncontradoError()
        return candidato


class PostulacionService:
    def __init__(self, db: Session) -> None:
        self.db = db
        self.repo = PostulacionRepository(db)
        self.vacantes = VacanteRepository(db)
        self.candidatos = CandidatoRepository(db)
        self.entrevistas = EntrevistaRepository(db)

    def postular(self, vacante_id: UUID, candidato_id: UUID) -> Postulacion:
        vacante = self.vacantes.get_by_id(vacante_id)
        if vacante is None:
            raise VacanteNoEncontradaError()
        if vacante.estado != EstadoVacanteEnum.PUBLICADA:
            raise VacanteNoPublicadaError()
        if self.candidatos.get_by_id(candidato_id) is None:
            raise CandidatoNoEncontradoError()

        existentes = self.repo.list_by_vacante(vacante_id)
        if any(p.candidato_id == candidato_id for p in existentes):
            raise PostulacionYaExisteError()

        return self.repo.create(Postulacion(vacante_id=vacante_id, candidato_id=candidato_id))

    def listar_por_vacante(self, vacante_id: UUID) -> list[Postulacion]:
        if self.vacantes.get_by_id(vacante_id) is None:
            raise VacanteNoEncontradaError()
        return self.repo.list_by_vacante(vacante_id)

    def obtener(self, postulacion_id: UUID) -> Postulacion:
        postulacion = self.repo.get_by_id(postulacion_id)
        if postulacion is None:
            raise PostulacionNoEncontradaError()
        return postulacion

    def cambiar_estado(self, postulacion_id: UUID, estado: EstadoPostulacionEnum) -> Postulacion:
        postulacion = self.obtener(postulacion_id)
        postulacion.estado = estado
        return self.repo.save(postulacion)

    def rechazar(self, postulacion_id: UUID, motivo: str | None) -> Postulacion:
        postulacion = self.obtener(postulacion_id)
        postulacion.estado = EstadoPostulacionEnum.RECHAZADA
        postulacion.motivo_rechazo = motivo
        return self.repo.save(postulacion)

    def agendar_entrevista(self, postulacion_id: UUID, data: EntrevistaCreate) -> Entrevista:
        self.obtener(postulacion_id)
        entrevista = Entrevista(postulacion_id=postulacion_id, **data.model_dump())
        return self.entrevistas.create(entrevista)

    def listar_entrevistas(self, postulacion_id: UUID) -> list[Entrevista]:
        self.obtener(postulacion_id)
        return self.entrevistas.list_by_postulacion(postulacion_id)

    def actualizar_entrevista(self, entrevista_id: UUID, data: EntrevistaActualizar) -> Entrevista:
        entrevista = self.entrevistas.get_by_id(entrevista_id)
        if entrevista is None:
            raise EntrevistaNoEncontradaError()
        for campo, valor in data.model_dump(exclude_unset=True).items():
            setattr(entrevista, campo, valor)
        return self.entrevistas.save(entrevista)

    def contratar(self, postulacion_id: UUID, data: ContratarPostulacionRequest) -> Empleado:
        postulacion = self.obtener(postulacion_id)
        vacante = self.vacantes.get_by_id(postulacion.vacante_id)
        if vacante is None:
            raise VacanteNoEncontradaError()
        candidato = self.candidatos.get_by_id(postulacion.candidato_id)
        if candidato is None:
            raise CandidatoNoEncontradoError()

        empleado_service = EmpleadoService(self.db)
        empleado = empleado_service.crear(
            EmpleadoCreate(
                nombres=candidato.nombres,
                apellidos=candidato.apellidos,
                cedula_o_dni=data.cedula_o_dni,
                fecha_nacimiento=data.fecha_nacimiento,
                telefono=candidato.telefono,
                fecha_ingreso=data.fecha_ingreso,
                puesto_id=data.puesto_id,
                sucursal_id=vacante.sucursal_id,
                departamento_id=vacante.departamento_id,
            )
        )
        empleado_service.crear_contrato(
            empleado.id,
            ContratoCreate(tipo=data.tipo_contrato, fecha_inicio=data.fecha_ingreso, salario=data.salario),
        )

        postulacion.estado = EstadoPostulacionEnum.CONTRATADO
        self.repo.save(postulacion)
        return empleado
