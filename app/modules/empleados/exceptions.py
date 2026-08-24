from app.core.exceptions import AppException


class EmpleadoNoEncontradoError(AppException):
    status_code = 404
    code = "EMPLEADO_NO_ENCONTRADO"

    def __init__(self) -> None:
        super().__init__("El empleado solicitado no existe")


class CedulaYaRegistradaError(AppException):
    status_code = 409
    code = "CEDULA_YA_REGISTRADA"

    def __init__(self) -> None:
        super().__init__("Ya existe un empleado registrado con esa cedula/DNI")


class UsuarioYaVinculadoError(AppException):
    status_code = 409
    code = "USUARIO_YA_VINCULADO"

    def __init__(self) -> None:
        super().__init__("Ese usuario ya esta vinculado a otro empleado")


class SucursalNoEncontradaError(AppException):
    status_code = 404
    code = "SUCURSAL_NO_ENCONTRADA"

    def __init__(self) -> None:
        super().__init__("La sucursal indicada no existe")


class DepartamentoNoEncontradoError(AppException):
    status_code = 404
    code = "DEPARTAMENTO_NO_ENCONTRADO"

    def __init__(self) -> None:
        super().__init__("El departamento indicado no existe")


class PuestoNoEncontradoError(AppException):
    status_code = 404
    code = "PUESTO_NO_ENCONTRADO"

    def __init__(self) -> None:
        super().__init__("El puesto indicado no existe")


class ContratoNoEncontradoError(AppException):
    status_code = 404
    code = "CONTRATO_NO_ENCONTRADO"

    def __init__(self) -> None:
        super().__init__("El contrato solicitado no existe")


class DocumentoNoEncontradoError(AppException):
    status_code = 404
    code = "DOCUMENTO_NO_ENCONTRADO"

    def __init__(self) -> None:
        super().__init__("El documento solicitado no existe")
