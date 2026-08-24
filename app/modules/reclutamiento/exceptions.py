from app.core.exceptions import AppException


class VacanteNoEncontradaError(AppException):
    status_code = 404
    code = "VACANTE_NO_ENCONTRADA"

    def __init__(self) -> None:
        super().__init__("La vacante solicitada no existe")


class CandidatoNoEncontradoError(AppException):
    status_code = 404
    code = "CANDIDATO_NO_ENCONTRADO"

    def __init__(self) -> None:
        super().__init__("El candidato solicitado no existe")


class EmailYaRegistradoComoCandidatoError(AppException):
    status_code = 409
    code = "CANDIDATO_EMAIL_YA_REGISTRADO"

    def __init__(self) -> None:
        super().__init__("Ya existe un candidato registrado con ese email")


class PostulacionNoEncontradaError(AppException):
    status_code = 404
    code = "POSTULACION_NO_ENCONTRADA"

    def __init__(self) -> None:
        super().__init__("La postulacion solicitada no existe")


class PostulacionYaExisteError(AppException):
    status_code = 409
    code = "POSTULACION_YA_EXISTE"

    def __init__(self) -> None:
        super().__init__("Este candidato ya se postulo a esta vacante")


class VacanteNoPublicadaError(AppException):
    status_code = 409
    code = "VACANTE_NO_PUBLICADA"

    def __init__(self) -> None:
        super().__init__("Solo se puede postular a vacantes publicadas")


class EntrevistaNoEncontradaError(AppException):
    status_code = 404
    code = "ENTREVISTA_NO_ENCONTRADA"

    def __init__(self) -> None:
        super().__init__("La entrevista solicitada no existe")
