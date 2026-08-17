"""Crea el primer usuario ADMIN_RRHH cuando la tabla de usuarios esta vacia.

Uso: python -m scripts.seed_admin
Variables de entorno opcionales: SEED_ADMIN_EMAIL, SEED_ADMIN_PASSWORD
"""

import os

from app.core.database import SessionLocal
from app.core.security import hash_password
from app.modules.auth.models import RolEnum, Usuario


def main() -> None:
    email = os.getenv("SEED_ADMIN_EMAIL", "admin@talento360.com")
    password = os.getenv("SEED_ADMIN_PASSWORD", "Admin123!")

    db = SessionLocal()
    try:
        if db.query(Usuario).count() > 0:
            print("Ya existen usuarios; no se creo ningun admin.")
            return

        admin = Usuario(email=email, password_hash=hash_password(password), rol=RolEnum.ADMIN_RRHH)
        db.add(admin)
        db.commit()
        print(f"Admin creado: {email} / {password} (cambiar la contrasena despues del primer login)")
    finally:
        db.close()


if __name__ == "__main__":
    main()
