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


class SucursalEnUsoError(AppException):
    status_code = 409
    code = "SUCURSAL_EN_USO"

    def __init__(self) -> None:
        super().__init__("No se puede eliminar: la sucursal esta asignada a empleados o vacantes")


class DepartamentoNoEncontradoError(AppException):
    status_code = 404
    code = "DEPARTAMENTO_NO_ENCONTRADO"

    def __init__(self) -> None:
        super().__init__("El departamento indicado no existe")


class DepartamentoEnUsoError(AppException):
    status_code = 409
    code = "DEPARTAMENTO_EN_USO"

    def __init__(self) -> None:
        super().__init__("No se puede eliminar: el departamento esta asignado a empleados, puestos o vacantes")


class PuestoNoEncontradoError(AppException):
    status_code = 404
    code = "PUESTO_NO_ENCONTRADO"

    def __init__(self) -> None:
        super().__init__("El puesto indicado no existe")


class PuestoEnUsoError(AppException):
    status_code = 409
    code = "PUESTO_EN_USO"

    def __init__(self) -> None:
        super().__init__("No se puede eliminar: el puesto esta asignado a uno o mas empleados")


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
