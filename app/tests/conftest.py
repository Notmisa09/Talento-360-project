import uuid
from collections.abc import Generator

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker
from sqlalchemy.pool import StaticPool

from app.core.database import get_db
from app.core.security import hash_password
from app.main import app
from app.modules.auth.models import RolEnum, Usuario
from app.shared.models import Base

# Importar los modelos de cada modulo para que se registren en Base.metadata,
# igual que hace alembic/env.py.
from app.modules.auth import models as _auth_models  # noqa: F401
from app.modules.empleados import models as _empleados_models  # noqa: F401
from app.modules.reclutamiento import models as _reclutamiento_models  # noqa: F401
from app.modules.desempeno import models as _desempeno_models  # noqa: F401


@pytest.fixture()
def db_session() -> Generator[Session, None, None]:
    """Cada test corre contra su propia base SQLite en memoria, ya creada desde cero."""
    engine = create_engine(
        "sqlite:///:memory:",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    Base.metadata.create_all(bind=engine)
    session_factory = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    session = session_factory()
    try:
        yield session
    finally:
        session.close()
        engine.dispose()


@pytest.fixture()
def client(db_session: Session) -> Generator[TestClient, None, None]:
    def _override_get_db() -> Generator[Session, None, None]:
        yield db_session

    app.dependency_overrides[get_db] = _override_get_db
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()


def _crear_usuario(db_session: Session, rol: RolEnum) -> tuple[str, str]:
    email = f"{rol.value.lower()}-{uuid.uuid4().hex[:8]}@talento360.com"
    password = "TestPass123!"
    usuario = Usuario(email=email, password_hash=hash_password(password), rol=rol)
    db_session.add(usuario)
    db_session.commit()
    return email, password


@pytest.fixture()
def admin_headers(db_session: Session, client: TestClient) -> dict[str, str]:
    email, password = _crear_usuario(db_session, RolEnum.ADMIN_RRHH)
    res = client.post("/api/v1/auth/login", data={"username": email, "password": password})
    assert res.status_code == 200, res.text
    token = res.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture()
def empleado_de_prueba(client: TestClient, admin_headers: dict[str, str]) -> dict:
    """Crea sucursal, departamento, puesto y un empleado; devuelve el empleado creado."""
    sucursal = client.post(
        "/api/v1/sucursales", json={"nombre": "Sucursal Central"}, headers=admin_headers
    ).json()
    departamento = client.post(
        "/api/v1/departamentos", json={"nombre": "Ventas"}, headers=admin_headers
    ).json()
    puesto = client.post(
        "/api/v1/puestos",
        json={"titulo": "Vendedor", "salario_base": 30000, "departamento_id": departamento["id"]},
        headers=admin_headers,
    ).json()
    empleado = client.post(
        "/api/v1/empleados",
        json={
            "nombres": "Juan",
            "apellidos": "Perez",
            "cedula_o_dni": "001-1111111-1",
            "fecha_nacimiento": "1995-01-01",
            "fecha_ingreso": "2026-01-01",
            "puesto_id": puesto["id"],
            "sucursal_id": sucursal["id"],
            "departamento_id": departamento["id"],
        },
        headers=admin_headers,
    ).json()
    return empleado
