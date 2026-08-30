from app.core.exceptions import AppException


class PeriodoNominaNoEncontradoError(AppException):
    status_code = 404
    code = "PERIODO_NOMINA_NO_ENCONTRADO"

    def __init__(self) -> None:
        super().__init__("El periodo de nomina solicitado no existe")


class PeriodoSolapadoError(AppException):
    status_code = 409
    code = "PERIODO_SOLAPADO"

    def __init__(self) -> None:
        super().__init__("El rango de fechas se solapa con un periodo de nomina existente")


class PeriodoYaProcesadoError(AppException):
    status_code = 409
    code = "PERIODO_YA_PROCESADO"

    def __init__(self) -> None:
        super().__init__("Este periodo ya fue procesado o cerrado")


class PeriodoNoProcesadoError(AppException):
    status_code = 409
    code = "PERIODO_NO_PROCESADO"

    def __init__(self) -> None:
        super().__init__("El periodo debe estar procesado antes de poder cerrarse")


class NominaNoEncontradaError(AppException):
    status_code = 404
    code = "NOMINA_NO_ENCONTRADA"

    def __init__(self) -> None:
        super().__init__("La nomina solicitada no existe")
