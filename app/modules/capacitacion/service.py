from decimal import Decimal
from pathlib import Path
from uuid import UUID

from sqlalchemy.orm import Session

from app.core.config import settings
from app.modules.capacitacion.exceptions import (
    CertificadoNoDisponibleError,
    CursoNoEncontradoError,
    InscripcionNoEncontradaError,
    InscripcionYaExisteError,
)
from app.modules.capacitacion.models import Curso, EstadoInscripcionEnum, Inscripcion
from app.modules.capacitacion.pdf import CertificadoPdfFactory
from app.modules.capacitacion.repository import CursoRepository, InscripcionRepository
from app.modules.capacitacion.schemas import CursoCreate
from app.modules.empleados.exceptions import EmpleadoNoEncontradoError
from app.modules.empleados.repository import EmpleadoRepository


class CursoService:
    def __init__(self, db: Session) -> None:
        self.repo = CursoRepository(db)

    def crear(self, data: CursoCreate) -> Curso:
        return self.repo.create(Curso(**data.model_dump()))

    def listar(self) -> list[Curso]:
        return self.repo.list()

    def obtener(self, curso_id: UUID) -> Curso:
        curso = self.repo.get_by_id(curso_id)
        if curso is None:
            raise CursoNoEncontradoError()
        return curso


class InscripcionService:
    def __init__(self, db: Session) -> None:
        self.repo = InscripcionRepository(db)
        self.cursos = CursoRepository(db)
        self.empleados = EmpleadoRepository(db)

    def inscribir(self, curso_id: UUID, empleado_id: UUID) -> Inscripcion:
        if self.cursos.get_by_id(curso_id) is None:
            raise CursoNoEncontradoError()
        if self.empleados.get_by_id(empleado_id) is None:
            raise EmpleadoNoEncontradoError()
        if self.repo.get_activa(curso_id, empleado_id) is not None:
            raise InscripcionYaExisteError()
        return self.repo.create(Inscripcion(curso_id=curso_id, empleado_id=empleado_id))

    def listar_por_curso(self, curso_id: UUID) -> list[Inscripcion]:
        if self.cursos.get_by_id(curso_id) is None:
            raise CursoNoEncontradoError()
        return self.repo.list_by_curso(curso_id)

    def listar_por_empleado(self, empleado_id: UUID) -> list[Inscripcion]:
        if self.empleados.get_by_id(empleado_id) is None:
            raise EmpleadoNoEncontradoError()
        return self.repo.list_by_empleado(empleado_id)

    def listar_certificados_de_empleado(self, empleado_id: UUID) -> list[Inscripcion]:
        if self.empleados.get_by_id(empleado_id) is None:
            raise EmpleadoNoEncontradoError()
        return self.repo.list_completados_por_empleado(empleado_id)

    def obtener(self, inscripcion_id: UUID) -> Inscripcion:
        inscripcion = self.repo.get_by_id(inscripcion_id)
        if inscripcion is None:
            raise InscripcionNoEncontradaError()
        return inscripcion

    def _generar_certificado(self, inscripcion: Inscripcion) -> Inscripcion:
        curso = self.cursos.get_by_id(inscripcion.curso_id)
        empleado = self.empleados.get_by_id(inscripcion.empleado_id)
        pdf_bytes = CertificadoPdfFactory.generar(inscripcion, curso, empleado)

        directorio = Path(settings.STORAGE_DIR) / "certificados" / str(inscripcion.id)
        directorio.mkdir(parents=True, exist_ok=True)
        ruta = directorio / f"certificado_{inscripcion.id.hex}.pdf"
        ruta.write_bytes(pdf_bytes)

        inscripcion.certificado_url = str(ruta)
        return self.repo.save(inscripcion)

    def actualizar_progreso(self, inscripcion_id: UUID, progreso: float) -> Inscripcion:
        inscripcion = self.obtener(inscripcion_id)
        inscripcion.actualizar_progreso(Decimal(str(progreso)))
        inscripcion = self.repo.save(inscripcion)

        if inscripcion.estado == EstadoInscripcionEnum.COMPLETADO and inscripcion.certificado_url is None:
            inscripcion = self._generar_certificado(inscripcion)

        return inscripcion

    def obtener_ruta_certificado(self, inscripcion_id: UUID) -> str:
        inscripcion = self.obtener(inscripcion_id)
        if inscripcion.certificado_url is None:
            raise CertificadoNoDisponibleError()
        return inscripcion.certificado_url
