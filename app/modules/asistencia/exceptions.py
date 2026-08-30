from app.core.exceptions import AppException


class MarcajeAbiertoError(AppException):
    status_code = 409
    code = "MARCAJE_ABIERTO"

    def __init__(self) -> None:
        super().__init__("El empleado ya tiene un marcaje de entrada sin salida registrada")


class NoHayMarcajeAbiertoError(AppException):
    status_code = 409
    code = "NO_HAY_MARCAJE_ABIERTO"

    def __init__(self) -> None:
        super().__init__("El empleado no tiene un marcaje de entrada abierto")


class RegistroAsistenciaNoEncontradoError(AppException):
    status_code = 404
    code = "REGISTRO_ASISTENCIA_NO_ENCONTRADO"

    def __init__(self) -> None:
        super().__init__("El registro de asistencia solicitado no existe")


class SolicitudPermisoNoEncontradaError(AppException):
    status_code = 404
    code = "SOLICITUD_PERMISO_NO_ENCONTRADA"

    def __init__(self) -> None:
        super().__init__("La solicitud de permiso solicitada no existe")


class SolicitudYaResueltaError(AppException):
    status_code = 409
    code = "SOLICITUD_YA_RESUELTA"

    def __init__(self) -> None:
        super().__init__("Esta solicitud ya fue aprobada o rechazada")


class RangoFechasInvalidoError(AppException):
    status_code = 422
    code = "RANGO_FECHAS_INVALIDO"

    def __init__(self) -> None:
        super().__init__("La fecha de fin no puede ser anterior a la fecha de inicio")


class SaldoVacacionesInsuficienteError(AppException):
    status_code = 409
    code = "SALDO_VACACIONES_INSUFICIENTE"

    def __init__(self, dias_disponibles: int, dias_solicitados: int) -> None:
        super().__init__(
            f"Saldo de vacaciones insuficiente: disponibles {dias_disponibles}, solicitados {dias_solicitados}"
        )
