from app.core.exceptions import AppException


class CicloEvaluacionNoEncontradoError(AppException):
    status_code = 404
    code = "CICLO_EVALUACION_NO_ENCONTRADO"

    def __init__(self) -> None:
        super().__init__("El ciclo de evaluacion solicitado no existe")


class ObjetivoNoEncontradoError(AppException):
    status_code = 404
    code = "OBJETIVO_NO_ENCONTRADO"

    def __init__(self) -> None:
        super().__init__("El objetivo solicitado no existe")
