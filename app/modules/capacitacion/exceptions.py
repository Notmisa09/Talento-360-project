from app.core.exceptions import AppException


class CursoNoEncontradoError(AppException):
    status_code = 404
    code = "CURSO_NO_ENCONTRADO"

    def __init__(self) -> None:
        super().__init__("El curso solicitado no existe")


class InscripcionNoEncontradaError(AppException):
    status_code = 404
    code = "INSCRIPCION_NO_ENCONTRADA"

    def __init__(self) -> None:
        super().__init__("La inscripcion solicitada no existe")


class InscripcionYaExisteError(AppException):
    status_code = 409
    code = "INSCRIPCION_YA_EXISTE"

    def __init__(self) -> None:
        super().__init__("El empleado ya esta inscrito (o completo) este curso")


class CertificadoNoDisponibleError(AppException):
    status_code = 409
    code = "CERTIFICADO_NO_DISPONIBLE"

    def __init__(self) -> None:
        super().__init__("El certificado aun no esta disponible; el curso no ha sido completado")
