from uuid import UUID

from sqlalchemy.orm import Session

from app.core.exceptions import AppException


class EmpleadoNoVinculadoError(AppException):
    status_code = 404
    code = "EMPLEADO_NO_VINCULADO"

    def __init__(self) -> None:
        super().__init__("El usuario actual no tiene un empleado vinculado")


def get_empleado_propio(db: Session, usuario_id: UUID):
    """Resuelve el Empleado ligado al usuario autenticado (usado por Autoservicio/ESS)."""
    from app.modules.empleados.repository import EmpleadoRepository

    empleado = EmpleadoRepository(db).get_by_usuario_id(usuario_id)
    if empleado is None:
        raise EmpleadoNoVinculadoError()
    return empleado
