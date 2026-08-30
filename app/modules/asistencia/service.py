import calendar
from datetime import date, datetime, time, timezone
from uuid import UUID

from sqlalchemy.orm import Session

from app.modules.asistencia.exceptions import (
    MarcajeAbiertoError,
    NoHayMarcajeAbiertoError,
    SaldoVacacionesInsuficienteError,
    SolicitudPermisoNoEncontradaError,
    SolicitudYaResueltaError,
)
from app.modules.asistencia.models import (
    EstadoSolicitudEnum,
    RegistroAsistencia,
    SaldoVacaciones,
    SolicitudPermiso,
    TipoPermisoEnum,
)
from app.modules.asistencia.repository import (
    RegistroAsistenciaRepository,
    SaldoVacacionesRepository,
    SolicitudPermisoRepository,
)
from app.modules.asistencia.schemas import ResumenAsistenciaOut, SolicitudPermisoCreate
from app.modules.empleados.exceptions import EmpleadoNoEncontradoError
from app.modules.empleados.repository import EmpleadoRepository


class AsistenciaService:
    def __init__(self, db: Session) -> None:
        self.registros = RegistroAsistenciaRepository(db)
        self.solicitudes = SolicitudPermisoRepository(db)
        self.saldos = SaldoVacacionesRepository(db)
        self.empleados = EmpleadoRepository(db)

    def _validar_empleado(self, empleado_id: UUID) -> None:
        if self.empleados.get_by_id(empleado_id) is None:
            raise EmpleadoNoEncontradoError()

    # --- Marcaje ---

    def marcar_entrada(self, empleado_id: UUID, origen: str) -> RegistroAsistencia:
        self._validar_empleado(empleado_id)
        if self.registros.get_abierto(empleado_id) is not None:
            raise MarcajeAbiertoError()
        registro = RegistroAsistencia(empleado_id=empleado_id, hora_entrada=datetime.now(timezone.utc), origen=origen)
        return self.registros.create(registro)

    def marcar_salida(self, empleado_id: UUID) -> RegistroAsistencia:
        self._validar_empleado(empleado_id)
        registro = self.registros.get_abierto(empleado_id)
        if registro is None:
            raise NoHayMarcajeAbiertoError()
        registro.hora_salida = datetime.now(timezone.utc)
        registro.calcular_horas()
        return self.registros.save(registro)

    def listar_registros(
        self, empleado_id: UUID, desde: date | None = None, hasta: date | None = None
    ) -> list[RegistroAsistencia]:
        self._validar_empleado(empleado_id)
        desde_dt = datetime.combine(desde, time.min, tzinfo=timezone.utc) if desde else None
        hasta_dt = datetime.combine(hasta, time.max, tzinfo=timezone.utc) if hasta else None
        return self.registros.list_by_empleado(empleado_id, desde_dt, hasta_dt)

    def resumen_mensual(self, empleado_id: UUID, mes: str) -> ResumenAsistenciaOut:
        self._validar_empleado(empleado_id)
        anio, mes_num = (int(parte) for parte in mes.split("-"))
        ultimo_dia = calendar.monthrange(anio, mes_num)[1]
        desde = date(anio, mes_num, 1)
        hasta = date(anio, mes_num, ultimo_dia)
        registros = self.listar_registros(empleado_id, desde, hasta)
        horas_trabajadas = sum(float(r.horas_trabajadas or 0) for r in registros)
        horas_extra = sum(float(r.horas_extra or 0) for r in registros)
        return ResumenAsistenciaOut(
            empleado_id=empleado_id,
            mes=mes,
            dias_registrados=len(registros),
            horas_trabajadas_total=round(horas_trabajadas, 2),
            horas_extra_total=round(horas_extra, 2),
        )

    # --- Vacaciones ---

    def obtener_o_crear_saldo(self, empleado_id: UUID, anio: int) -> SaldoVacaciones:
        self._validar_empleado(empleado_id)
        saldo = self.saldos.get_by_empleado_anio(empleado_id, anio)
        if saldo is None:
            saldo = self.saldos.create(SaldoVacaciones(empleado_id=empleado_id, anio=anio))
        return saldo

    def ajustar_saldo(self, empleado_id: UUID, dias_disponibles: int, anio: int) -> SaldoVacaciones:
        saldo = self.obtener_o_crear_saldo(empleado_id, anio)
        saldo.dias_disponibles = dias_disponibles
        return self.saldos.save(saldo)

    # --- Permisos ---

    def crear_solicitud_permiso(self, data: SolicitudPermisoCreate) -> SolicitudPermiso:
        self._validar_empleado(data.empleado_id)
        dias_solicitados = (data.fecha_fin - data.fecha_inicio).days + 1

        if data.tipo == TipoPermisoEnum.VACACIONES:
            saldo = self.obtener_o_crear_saldo(data.empleado_id, data.fecha_inicio.year)
            if saldo.dias_disponibles < dias_solicitados:
                raise SaldoVacacionesInsuficienteError(saldo.dias_disponibles, dias_solicitados)

        solicitud = SolicitudPermiso(**data.model_dump())
        return self.solicitudes.create(solicitud)

    def listar_solicitudes(
        self, empleado_id: UUID | None, estado: EstadoSolicitudEnum | None
    ) -> list[SolicitudPermiso]:
        if empleado_id is not None:
            self._validar_empleado(empleado_id)
        return self.solicitudes.list(empleado_id, estado)

    def obtener_solicitud(self, solicitud_id: UUID) -> SolicitudPermiso:
        solicitud = self.solicitudes.get_by_id(solicitud_id)
        if solicitud is None:
            raise SolicitudPermisoNoEncontradaError()
        return solicitud

    def aprobar_solicitud(self, solicitud_id: UUID, aprobado_por: UUID) -> SolicitudPermiso:
        solicitud = self.obtener_solicitud(solicitud_id)
        if solicitud.estado != EstadoSolicitudEnum.PENDIENTE:
            raise SolicitudYaResueltaError()

        if solicitud.tipo == TipoPermisoEnum.VACACIONES:
            saldo = self.obtener_o_crear_saldo(solicitud.empleado_id, solicitud.fecha_inicio.year)
            dias = solicitud.dias_solicitados
            if saldo.dias_disponibles < dias:
                raise SaldoVacacionesInsuficienteError(saldo.dias_disponibles, dias)
            saldo.dias_disponibles -= dias
            saldo.dias_tomados += dias
            self.saldos.save(saldo)

        solicitud.aprobar(aprobado_por)
        return self.solicitudes.save(solicitud)

    def rechazar_solicitud(self, solicitud_id: UUID, aprobado_por: UUID, motivo: str | None) -> SolicitudPermiso:
        solicitud = self.obtener_solicitud(solicitud_id)
        if solicitud.estado != EstadoSolicitudEnum.PENDIENTE:
            raise SolicitudYaResueltaError()
        solicitud.rechazar(aprobado_por, motivo)
        return self.solicitudes.save(solicitud)
