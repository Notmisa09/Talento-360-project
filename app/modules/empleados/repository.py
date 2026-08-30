from uuid import UUID

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.modules.empleados.models import (
    Contrato,
    DatosLegales,
    Departamento,
    DocumentoExpediente,
    Empleado,
    EstadoEmpleadoEnum,
    Puesto,
    Sucursal,
)


class SucursalRepository:
    def __init__(self, db: Session) -> None:
        self.db = db

    def get_by_id(self, sucursal_id: UUID) -> Sucursal | None:
        return self.db.get(Sucursal, sucursal_id)

    def list(self) -> list[Sucursal]:
        return list(self.db.execute(select(Sucursal).order_by(Sucursal.nombre)).scalars().all())

    def create(self, sucursal: Sucursal) -> Sucursal:
        self.db.add(sucursal)
        self.db.commit()
        self.db.refresh(sucursal)
        return sucursal

    def save(self, sucursal: Sucursal) -> Sucursal:
        self.db.commit()
        self.db.refresh(sucursal)
        return sucursal

    def delete(self, sucursal: Sucursal) -> None:
        self.db.delete(sucursal)
        self.db.commit()


class DepartamentoRepository:
    def __init__(self, db: Session) -> None:
        self.db = db

    def get_by_id(self, departamento_id: UUID) -> Departamento | None:
        return self.db.get(Departamento, departamento_id)

    def list(self) -> list[Departamento]:
        return list(self.db.execute(select(Departamento).order_by(Departamento.nombre)).scalars().all())

    def create(self, departamento: Departamento) -> Departamento:
        self.db.add(departamento)
        self.db.commit()
        self.db.refresh(departamento)
        return departamento

    def save(self, departamento: Departamento) -> Departamento:
        self.db.commit()
        self.db.refresh(departamento)
        return departamento

    def delete(self, departamento: Departamento) -> None:
        self.db.delete(departamento)
        self.db.commit()


class PuestoRepository:
    def __init__(self, db: Session) -> None:
        self.db = db

    def get_by_id(self, puesto_id: UUID) -> Puesto | None:
        return self.db.get(Puesto, puesto_id)

    def list(self, departamento_id: UUID | None = None) -> list[Puesto]:
        stmt = select(Puesto).order_by(Puesto.titulo)
        if departamento_id is not None:
            stmt = stmt.where(Puesto.departamento_id == departamento_id)
        return list(self.db.execute(stmt).scalars().all())

    def create(self, puesto: Puesto) -> Puesto:
        self.db.add(puesto)
        self.db.commit()
        self.db.refresh(puesto)
        return puesto

    def save(self, puesto: Puesto) -> Puesto:
        self.db.commit()
        self.db.refresh(puesto)
        return puesto

    def delete(self, puesto: Puesto) -> None:
        self.db.delete(puesto)
        self.db.commit()

    def exists_by_departamento(self, departamento_id: UUID) -> bool:
        stmt = select(Puesto.id).where(Puesto.departamento_id == departamento_id).limit(1)
        return self.db.execute(stmt).first() is not None


class EmpleadoRepository:
    def __init__(self, db: Session) -> None:
        self.db = db

    def get_by_id(self, empleado_id: UUID) -> Empleado | None:
        return self.db.get(Empleado, empleado_id)

    def get_by_usuario_id(self, usuario_id: UUID) -> Empleado | None:
        stmt = select(Empleado).where(Empleado.usuario_id == usuario_id)
        return self.db.execute(stmt).scalar_one_or_none()

    def get_by_cedula(self, cedula: str) -> Empleado | None:
        stmt = select(Empleado).where(Empleado.cedula_o_dni == cedula)
        return self.db.execute(stmt).scalar_one_or_none()

    def exists_by_sucursal(self, sucursal_id: UUID) -> bool:
        stmt = select(Empleado.id).where(Empleado.sucursal_id == sucursal_id).limit(1)
        return self.db.execute(stmt).first() is not None

    def exists_by_departamento(self, departamento_id: UUID) -> bool:
        stmt = select(Empleado.id).where(Empleado.departamento_id == departamento_id).limit(1)
        return self.db.execute(stmt).first() is not None

    def exists_by_puesto(self, puesto_id: UUID) -> bool:
        stmt = select(Empleado.id).where(Empleado.puesto_id == puesto_id).limit(1)
        return self.db.execute(stmt).first() is not None

    def count(self) -> int:
        return self.db.execute(select(func.count()).select_from(Empleado)).scalar_one()

    def list_activos(self) -> list[Empleado]:
        stmt = select(Empleado).where(Empleado.estado == EstadoEmpleadoEnum.ACTIVO)
        return list(self.db.execute(stmt).scalars().all())

    def list(
        self,
        page: int,
        size: int,
        estado: EstadoEmpleadoEnum | None = None,
        departamento_id: UUID | None = None,
        q: str | None = None,
    ) -> tuple[list[Empleado], int]:
        stmt = select(Empleado)
        count_stmt = select(func.count()).select_from(Empleado)

        if estado is not None:
            stmt = stmt.where(Empleado.estado == estado)
            count_stmt = count_stmt.where(Empleado.estado == estado)
        if departamento_id is not None:
            stmt = stmt.where(Empleado.departamento_id == departamento_id)
            count_stmt = count_stmt.where(Empleado.departamento_id == departamento_id)
        if q:
            patron = f"%{q.lower()}%"
            filtro = func.lower(Empleado.nombres + " " + Empleado.apellidos).like(patron)
            stmt = stmt.where(filtro)
            count_stmt = count_stmt.where(filtro)

        total = self.db.execute(count_stmt).scalar_one()
        stmt = stmt.order_by(Empleado.creado_en.desc()).offset((page - 1) * size).limit(size)
        items = list(self.db.execute(stmt).scalars().all())
        return items, total

    def create(self, empleado: Empleado) -> Empleado:
        self.db.add(empleado)
        self.db.commit()
        self.db.refresh(empleado)
        return empleado

    def save(self, empleado: Empleado) -> Empleado:
        self.db.commit()
        self.db.refresh(empleado)
        return empleado


class ContratoRepository:
    def __init__(self, db: Session) -> None:
        self.db = db

    def get_by_id(self, contrato_id: UUID) -> Contrato | None:
        return self.db.get(Contrato, contrato_id)

    def list_by_empleado(self, empleado_id: UUID) -> list[Contrato]:
        stmt = select(Contrato).where(Contrato.empleado_id == empleado_id).order_by(Contrato.fecha_inicio.desc())
        return list(self.db.execute(stmt).scalars().all())

    def create(self, contrato: Contrato) -> Contrato:
        self.db.add(contrato)
        self.db.commit()
        self.db.refresh(contrato)
        return contrato

    def save(self, contrato: Contrato) -> Contrato:
        self.db.commit()
        self.db.refresh(contrato)
        return contrato


class DocumentoExpedienteRepository:
    def __init__(self, db: Session) -> None:
        self.db = db

    def get_by_id(self, documento_id: UUID) -> DocumentoExpediente | None:
        return self.db.get(DocumentoExpediente, documento_id)

    def list_by_empleado(self, empleado_id: UUID) -> list[DocumentoExpediente]:
        stmt = (
            select(DocumentoExpediente)
            .where(DocumentoExpediente.empleado_id == empleado_id)
            .order_by(DocumentoExpediente.fecha_carga.desc())
        )
        return list(self.db.execute(stmt).scalars().all())

    def create(self, documento: DocumentoExpediente) -> DocumentoExpediente:
        self.db.add(documento)
        self.db.commit()
        self.db.refresh(documento)
        return documento


class DatosLegalesRepository:
    def __init__(self, db: Session) -> None:
        self.db = db

    def get_by_empleado(self, empleado_id: UUID) -> DatosLegales | None:
        stmt = select(DatosLegales).where(DatosLegales.empleado_id == empleado_id)
        return self.db.execute(stmt).scalar_one_or_none()

    def create(self, datos: DatosLegales) -> DatosLegales:
        self.db.add(datos)
        self.db.commit()
        self.db.refresh(datos)
        return datos

    def save(self, datos: DatosLegales) -> DatosLegales:
        self.db.commit()
        self.db.refresh(datos)
        return datos
