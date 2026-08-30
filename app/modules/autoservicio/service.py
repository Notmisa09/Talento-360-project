from datetime import date
from uuid import UUID

from sqlalchemy.orm import Session

from app.core.exceptions import AppException
from app.modules.asistencia.models import SaldoVacaciones, SolicitudPermiso
from app.modules.asistencia.schemas import SolicitudPermisoCreate
from app.modules.asistencia.service import AsistenciaService
from app.modules.autoservicio.schemas import SolicitarPermisoRequest
from app.modules.capacitacion.models import Inscripcion
from app.modules.capacitacion.service import InscripcionService
from app.modules.desempeno.models import Evaluacion
from app.modules.desempeno.repository import EvaluacionRepository
from app.modules.empleados.models import Empleado
from app.modules.empleados.service import EmpleadoService
from app.modules.nomina.models import Nomina
from app.modules.nomina.service import NominaService
from app.shared.auth_helpers import get_empleado_propio


class AutoservicioService:
    def __init__(self, db: Session) -> None:
        self.db = db
        self.empleados = EmpleadoService(db)
        self.asistencia = AsistenciaService(db)
        self.nomina = NominaService(db)
        self.inscripciones = InscripcionService(db)
        self.evaluaciones = EvaluacionRepository(db)

    def _propio(self, usuario_id: UUID) -> Empleado:
        return get_empleado_propio(self.db, usuario_id)

    def mi_perfil(self, usuario_id: UUID) -> Empleado:
        return self._propio(usuario_id)

    def mis_volantes_pago(self, usuario_id: UUID) -> list[Nomina]:
        empleado = self._propio(usuario_id)
        return self.nomina.listar_por_empleado(empleado.id)

    def descargar_volante(self, usuario_id: UUID, nomina_id: UUID) -> bytes:
        empleado = self._propio(usuario_id)
        nomina = self.nomina.obtener(nomina_id)
        if nomina.empleado_id != empleado.id:
            raise AppException("No tiene permiso para acceder a esta nomina", code="PERMISO_DENEGADO", status_code=403)
        return self.nomina.generar_volante_pdf(nomina_id)

    def solicitar_permiso(self, usuario_id: UUID, data: SolicitarPermisoRequest) -> SolicitudPermiso:
        empleado = self._propio(usuario_id)
        solicitud = SolicitudPermisoCreate(
            empleado_id=empleado.id,
            tipo=data.tipo,
            fecha_inicio=data.fecha_inicio,
            fecha_fin=data.fecha_fin,
            motivo=data.motivo,
        )
        return self.asistencia.crear_solicitud_permiso(solicitud)

    def mis_permisos(self, usuario_id: UUID) -> list[SolicitudPermiso]:
        empleado = self._propio(usuario_id)
        return self.asistencia.listar_solicitudes(empleado.id, None)

    def mi_saldo_vacaciones(self, usuario_id: UUID, anio: int | None) -> SaldoVacaciones:
        empleado = self._propio(usuario_id)
        return self.asistencia.obtener_o_crear_saldo(empleado.id, anio or date.today().year)

    def mis_cursos(self, usuario_id: UUID) -> list[Inscripcion]:
        empleado = self._propio(usuario_id)
        return self.inscripciones.listar_por_empleado(empleado.id)

    def mis_evaluaciones(self, usuario_id: UUID) -> list[Evaluacion]:
        empleado = self._propio(usuario_id)
        return self.evaluaciones.list_by_empleado(empleado.id)
