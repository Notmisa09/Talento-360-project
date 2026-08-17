from app.core.exceptions import AppException


class CredencialesInvalidasError(AppException):
    status_code = 401
    code = "CREDENCIALES_INVALIDAS"

    def __init__(self) -> None:
        super().__init__("Email o contrasena incorrectos")


class UsuarioNoEncontradoError(AppException):
    status_code = 404
    code = "USUARIO_NO_ENCONTRADO"

    def __init__(self) -> None:
        super().__init__("El usuario solicitado no existe")


class EmailYaRegistradoError(AppException):
    status_code = 409
    code = "EMAIL_YA_REGISTRADO"

    def __init__(self) -> None:
        super().__init__("Ya existe un usuario registrado con ese email")


class PasswordActualIncorrectaError(AppException):
    status_code = 400
    code = "PASSWORD_ACTUAL_INCORRECTA"

    def __init__(self) -> None:
        super().__init__("La contrasena actual proporcionada no es correcta")
