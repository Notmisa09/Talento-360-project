from uuid import UUID

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.modules.auth.models import Usuario


class UsuarioRepository:
    def __init__(self, db: Session) -> None:
        self.db = db

    def get_by_id(self, usuario_id: UUID) -> Usuario | None:
        return self.db.get(Usuario, usuario_id)

    def get_by_email(self, email: str) -> Usuario | None:
        stmt = select(Usuario).where(func.lower(Usuario.email) == email.lower())
        return self.db.execute(stmt).scalar_one_or_none()

    def list(self, page: int, size: int) -> tuple[list[Usuario], int]:
        total = self.db.execute(select(func.count()).select_from(Usuario)).scalar_one()
        stmt = select(Usuario).order_by(Usuario.fecha_creacion.desc()).offset((page - 1) * size).limit(size)
        items = list(self.db.execute(stmt).scalars().all())
        return items, total

    def create(self, usuario: Usuario) -> Usuario:
        self.db.add(usuario)
        self.db.commit()
        self.db.refresh(usuario)
        return usuario

    def save(self, usuario: Usuario) -> Usuario:
        self.db.commit()
        self.db.refresh(usuario)
        return usuario
