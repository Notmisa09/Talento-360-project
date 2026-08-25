import uuid

from fastapi.testclient import TestClient


def _crear_ciclo(client: TestClient, headers: dict) -> dict:
    res = client.post(
        "/api/v1/ciclos-evaluacion",
        json={"nombre": "2026 - Semestre 1", "fecha_inicio": "2026-01-01", "fecha_fin": "2026-06-30"},
        headers=headers,
    )
    assert res.status_code == 201, res.text
    return res.json()


def test_crear_ciclo_evaluacion(client: TestClient, admin_headers: dict) -> None:
    ciclo = _crear_ciclo(client, admin_headers)
    assert ciclo["nombre"] == "2026 - Semestre 1"

    listado = client.get("/api/v1/ciclos-evaluacion", headers=admin_headers)
    assert listado.status_code == 200
    assert any(c["id"] == ciclo["id"] for c in listado.json())


def test_objetivo_calcula_progreso_al_actualizar_avance(
    client: TestClient, admin_headers: dict, empleado_de_prueba: dict
) -> None:
    ciclo = _crear_ciclo(client, admin_headers)

    res = client.post(
        "/api/v1/objetivos",
        json={
            "empleado_id": empleado_de_prueba["id"],
            "ciclo_id": ciclo["id"],
            "descripcion": "Vender 100 unidades",
            "meta_valor": 100,
        },
        headers=admin_headers,
    )
    assert res.status_code == 201, res.text
    objetivo = res.json()
    assert objetivo["valor_actual"] == 0
    assert objetivo["progreso"] == 0

    res = client.patch(
        f"/api/v1/objetivos/{objetivo['id']}/avance", json={"valor_actual": 45}, headers=admin_headers
    )
    assert res.status_code == 200, res.text
    actualizado = res.json()
    assert actualizado["valor_actual"] == 45
    assert actualizado["progreso"] == 45.0


def test_objetivo_progreso_no_se_rompe_con_meta_cero_division(
    client: TestClient, admin_headers: dict, empleado_de_prueba: dict
) -> None:
    """meta_valor tiene que ser > 0 en el schema, pero probamos igual el limite de negocio."""
    ciclo = _crear_ciclo(client, admin_headers)

    res = client.post(
        "/api/v1/objetivos",
        json={
            "empleado_id": empleado_de_prueba["id"],
            "ciclo_id": ciclo["id"],
            "descripcion": "Meta invalida",
            "meta_valor": 0,
        },
        headers=admin_headers,
    )
    assert res.status_code == 422


def test_crear_evaluacion_y_ver_historial(
    client: TestClient, admin_headers: dict, empleado_de_prueba: dict
) -> None:
    ciclo = _crear_ciclo(client, admin_headers)
    me = client.get("/api/v1/auth/me", headers=admin_headers).json()

    res = client.post(
        "/api/v1/evaluaciones",
        json={
            "empleado_id": empleado_de_prueba["id"],
            "evaluador_id": me["id"],
            "ciclo_id": ciclo["id"],
            "calificacion_final": 88.5,
            "comentarios": "Buen desempeno",
            "plan_mejora": "Mejorar puntualidad",
        },
        headers=admin_headers,
    )
    assert res.status_code == 201, res.text
    evaluacion = res.json()
    assert evaluacion["calificacion_final"] == 88.5
    assert evaluacion["evaluador_id"] == me["id"]

    client.post(
        "/api/v1/objetivos",
        json={
            "empleado_id": empleado_de_prueba["id"],
            "ciclo_id": ciclo["id"],
            "descripcion": "Vender 100 unidades",
            "meta_valor": 100,
        },
        headers=admin_headers,
    )

    historial = client.get(
        f"/api/v1/desempeno/empleados/{empleado_de_prueba['id']}/historial-desempeno", headers=admin_headers
    )
    assert historial.status_code == 200, historial.text
    data = historial.json()
    assert len(data["objetivos"]) == 1
    assert len(data["evaluaciones"]) == 1
    assert data["evaluaciones"][0]["id"] == evaluacion["id"]


def test_calificacion_fuera_de_rango_es_rechazada(
    client: TestClient, admin_headers: dict, empleado_de_prueba: dict
) -> None:
    ciclo = _crear_ciclo(client, admin_headers)
    me = client.get("/api/v1/auth/me", headers=admin_headers).json()

    res = client.post(
        "/api/v1/evaluaciones",
        json={
            "empleado_id": empleado_de_prueba["id"],
            "evaluador_id": me["id"],
            "ciclo_id": ciclo["id"],
            "calificacion_final": 150,
        },
        headers=admin_headers,
    )
    assert res.status_code == 422


def test_objetivo_para_empleado_inexistente_devuelve_404(client: TestClient, admin_headers: dict) -> None:
    ciclo = _crear_ciclo(client, admin_headers)
    res = client.post(
        "/api/v1/objetivos",
        json={
            "empleado_id": str(uuid.uuid4()),
            "ciclo_id": ciclo["id"],
            "descripcion": "Objetivo huerfano",
            "meta_valor": 10,
        },
        headers=admin_headers,
    )
    assert res.status_code == 404
    assert res.json()["code"] == "EMPLEADO_NO_ENCONTRADO"


def test_objetivo_para_ciclo_inexistente_devuelve_404(
    client: TestClient, admin_headers: dict, empleado_de_prueba: dict
) -> None:
    res = client.post(
        "/api/v1/objetivos",
        json={
            "empleado_id": empleado_de_prueba["id"],
            "ciclo_id": str(uuid.uuid4()),
            "descripcion": "Objetivo con ciclo inexistente",
            "meta_valor": 10,
        },
        headers=admin_headers,
    )
    assert res.status_code == 404
    assert res.json()["code"] == "CICLO_EVALUACION_NO_ENCONTRADO"


def test_desempeno_requiere_autenticacion(client: TestClient) -> None:
    res = client.get("/api/v1/ciclos-evaluacion")
    assert res.status_code == 401


def test_empleado_rol_no_puede_gestionar_desempeno(client: TestClient, db_session, admin_headers: dict) -> None:
    from app.core.security import hash_password
    from app.modules.auth.models import RolEnum, Usuario

    email = f"empleado-{uuid.uuid4().hex[:8]}@talento360.com"
    password = "TestPass123!"
    usuario = Usuario(email=email, password_hash=hash_password(password), rol=RolEnum.EMPLEADO)
    db_session.add(usuario)
    db_session.commit()

    login = client.post("/api/v1/auth/login", data={"username": email, "password": password})
    headers = {"Authorization": f"Bearer {login.json()['access_token']}"}

    res = client.post(
        "/api/v1/ciclos-evaluacion",
        json={"nombre": "No deberia crear esto", "fecha_inicio": "2026-01-01", "fecha_fin": "2026-06-30"},
        headers=headers,
    )
    assert res.status_code == 403
