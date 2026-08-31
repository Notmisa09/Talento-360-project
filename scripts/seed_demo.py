"""Genera datos de demostracion completos para presentar Talento360-HR.

Uso: python -m scripts.seed_demo

Requiere una base de datos recien creada (tablas vacias, ej. despues de
`alembic upgrade head` sobre un archivo nuevo). Usa la API real de la
aplicacion (via TestClient) para que todas las reglas de negocio y
validaciones se respeten igual que si un usuario lo hiciera desde la
interfaz web. La unica excepcion es el historial de asistencia: como el
marcaje solo registra la hora "actual" del servidor, se insertan algunos
registros directamente en la base de datos para simular varios dias con
horas trabajadas y horas extra ya existentes, usando el mismo calculo
(`RegistroAsistencia.calcular_horas`) que usa la aplicacion.
"""

import uuid
from datetime import date, datetime, timedelta, timezone

from fastapi.testclient import TestClient

from app.core.database import SessionLocal
from app.core.security import hash_password
from app.main import app
from app.modules.asistencia.models import RegistroAsistencia
from app.modules.auth.models import RolEnum, Usuario

PASSWORD_DEMO = "Demo1234!"
ADMIN_EMAIL = "misamora03@gmail.com"

client = TestClient(app)
credenciales_creadas: list[tuple[str, str, str]] = []


def _bootstrap_admin() -> None:
    """Crea el primer ADMIN_RRHH directo en la BD (no hay registro publico)."""
    db = SessionLocal()
    try:
        admin = Usuario(email=ADMIN_EMAIL, password_hash=hash_password(PASSWORD_DEMO), rol=RolEnum.ADMIN_RRHH)
        db.add(admin)
        db.commit()
    finally:
        db.close()
    credenciales_creadas.append((ADMIN_EMAIL, PASSWORD_DEMO, "ADMIN_RRHH"))


def _login(email: str, password: str) -> dict[str, str]:
    res = client.post("/api/v1/auth/login", data={"username": email, "password": password})
    _check(res, f"login {email}")
    token = res.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


def _check(res, contexto: str):
    if res.status_code >= 400:
        raise RuntimeError(f"Fallo en {contexto}: {res.status_code} {res.text}")
    return res


def main() -> None:
    print("=== Sembrando datos de demostracion para Talento360-HR ===\n")

    _bootstrap_admin()
    admin = _login(ADMIN_EMAIL, PASSWORD_DEMO)
    print(f"Admin listo: {ADMIN_EMAIL} / {PASSWORD_DEMO}")

    # --- Usuarios adicionales ---
    supervisor = _check(
        client.post(
            "/api/v1/usuarios",
            json={"email": "supervisor.demo@talento360.com", "password": PASSWORD_DEMO, "rol": "SUPERVISOR"},
            headers=admin,
        ),
        "crear supervisor",
    ).json()
    credenciales_creadas.append((supervisor["email"], PASSWORD_DEMO, "SUPERVISOR"))

    cuentas_empleado = {}
    for nombre_cuenta in ["empleado1.demo@talento360.com", "empleado2.demo@talento360.com"]:
        u = _check(
            client.post(
                "/api/v1/usuarios",
                json={"email": nombre_cuenta, "password": PASSWORD_DEMO, "rol": "EMPLEADO"},
                headers=admin,
            ),
            f"crear usuario {nombre_cuenta}",
        ).json()
        cuentas_empleado[nombre_cuenta] = u["id"]
        credenciales_creadas.append((nombre_cuenta, PASSWORD_DEMO, "EMPLEADO"))
    print(f"{2 + 1} usuarios adicionales creados (1 supervisor, 2 empleado)")

    # --- Catalogos: sucursales, departamentos, puestos ---
    sucursales = {}
    for nombre, ciudad in [
        ("Sucursal Piantini", "Santo Domingo"),
        ("Sucursal Bavaro", "Punta Cana"),
        ("Sucursal Santiago", "Santiago"),
    ]:
        s = _check(client.post("/api/v1/sucursales", json={"nombre": nombre, "ciudad": ciudad}, headers=admin), f"crear {nombre}").json()
        sucursales[nombre] = s["id"]

    departamentos = {}
    for nombre in ["Ventas", "Tecnologia", "Recursos Humanos", "Operaciones"]:
        d = _check(client.post("/api/v1/departamentos", json={"nombre": nombre}, headers=admin), f"crear depto {nombre}").json()
        departamentos[nombre] = d["id"]

    puestos_def = [
        ("Ejecutivo de Ventas", 35000, "Ventas"),
        ("Gerente de Ventas", 65000, "Ventas"),
        ("Desarrollador de Software", 55000, "Tecnologia"),
        ("Analista de Soporte TI", 32000, "Tecnologia"),
        ("Generalista de RRHH", 40000, "Recursos Humanos"),
        ("Reclutador", 34000, "Recursos Humanos"),
        ("Coordinador de Operaciones", 38000, "Operaciones"),
        ("Auxiliar de Almacen", 24000, "Operaciones"),
    ]
    puestos = {}
    for titulo, salario, depto in puestos_def:
        p = _check(
            client.post(
                "/api/v1/puestos",
                json={"titulo": titulo, "salario_base": salario, "departamento_id": departamentos[depto]},
                headers=admin,
            ),
            f"crear puesto {titulo}",
        ).json()
        puestos[titulo] = p["id"]
    print(f"Catalogos listos: {len(sucursales)} sucursales, {len(departamentos)} departamentos, {len(puestos)} puestos")

    # --- Empleados + contratos ---
    hace_2_anios = (date.today() - timedelta(days=730)).isoformat()
    hace_1_anio = (date.today() - timedelta(days=365)).isoformat()
    hace_6_meses = (date.today() - timedelta(days=180)).isoformat()
    hace_3_meses = (date.today() - timedelta(days=90)).isoformat()
    en_6_meses = (date.today() + timedelta(days=180)).isoformat()

    empleados_def = [
        # (nombres, apellidos, cedula, fecha_nac, fecha_ingreso, puesto, sucursal, depto, tipo_contrato, salario_contrato, fecha_fin_contrato, usuario_cuenta)
        ("Maria", "Rodriguez", "001-1111111-1", "1992-03-14", hace_2_anios, "Ejecutivo de Ventas", "Sucursal Piantini", "Ventas", "INDEFINIDO", 35000, None, "empleado1.demo@talento360.com"),
        ("Carlos", "Mendez", "001-2222222-2", "1985-07-01", hace_2_anios, "Gerente de Ventas", "Sucursal Piantini", "Ventas", "INDEFINIDO", 65000, None, None),
        ("Ana", "Familia", "001-3333333-3", "1994-11-20", hace_1_anio, "Desarrollador de Software", "Sucursal Santiago", "Tecnologia", "INDEFINIDO", 55000, None, "empleado2.demo@talento360.com"),
        ("Luis", "Objio", "001-4444444-4", "1998-02-08", hace_6_meses, "Analista de Soporte TI", "Sucursal Bavaro", "Tecnologia", "TEMPORAL", 32000, en_6_meses, None),
        ("Carmen", "Pena", "001-5555555-5", "1990-05-30", hace_1_anio, "Generalista de RRHH", "Sucursal Piantini", "Recursos Humanos", "INDEFINIDO", 40000, None, None),
        ("Pedro", "Reyes", "001-6666666-6", "2001-09-12", hace_3_meses, "Reclutador", "Sucursal Piantini", "Recursos Humanos", "PRACTICA", 15000, None, None),
        ("Julissa", "Tavarez", "001-7777777-7", "1988-12-03", hace_1_anio, "Coordinador de Operaciones", "Sucursal Bavaro", "Operaciones", "INDEFINIDO", 38000, None, None),
        ("Miguel", "Ozuna", "001-8888888-8", "1996-06-18", hace_6_meses, "Auxiliar de Almacen", "Sucursal Bavaro", "Operaciones", "POR_HORAS", 24000, None, None),
        ("Rosa", "Encarnacion", "001-9999999-9", "1993-01-25", hace_1_anio, "Ejecutivo de Ventas", "Sucursal Piantini", "Ventas", "INDEFINIDO", 35000, None, None),
    ]

    empleados = {}
    for (nombres, apellidos, cedula, fnac, fing, puesto, sucursal, depto, tipo, salario, ffin, cuenta) in empleados_def:
        payload = {
            "nombres": nombres,
            "apellidos": apellidos,
            "cedula_o_dni": cedula,
            "fecha_nacimiento": fnac,
            "fecha_ingreso": fing,
            "puesto_id": puestos[puesto],
            "sucursal_id": sucursales[sucursal],
            "departamento_id": departamentos[depto],
        }
        if cuenta:
            payload["usuario_id"] = cuentas_empleado[cuenta]
        emp = _check(client.post("/api/v1/empleados", json=payload, headers=admin), f"crear empleado {nombres}").json()
        empleados[f"{nombres} {apellidos}"] = emp["id"]

        _check(
            client.post(
                f"/api/v1/empleados/{emp['id']}/contratos",
                json={"tipo": tipo, "fecha_inicio": fing, "fecha_fin": ffin, "salario": salario},
                headers=admin,
            ),
            f"crear contrato de {nombres}",
        )

    # Rosa queda inactiva (para demostrar el filtro de estado)
    _check(
        client.patch(f"/api/v1/empleados/{empleados['Rosa Encarnacion']}/estado", json={"estado": "INACTIVO"}, headers=admin),
        "marcar a Rosa como inactiva",
    )
    print(f"{len(empleados)} empleados creados con sus contratos (variedad: indefinido, temporal, por horas, practica)")

    # --- Asistencia: backfill de historial (excepcion documentada arriba) ---
    db = SessionLocal()
    try:
        asalariados_con_extra = ["Maria Rodriguez", "Carlos Mendez", "Ana Familia", "Luis Objio", "Julissa Tavarez"]
        for nombre in asalariados_con_extra:
            emp_id = empleados[nombre]
            for dias_atras in [1, 2, 3, 6, 7]:
                dia = date.today() - timedelta(days=dias_atras)
                horas_jornada = 10 if dias_atras in (2, 7) else 8  # un par de dias con horas extra
                entrada = datetime.combine(dia, datetime.min.time(), tzinfo=timezone.utc).replace(hour=8)
                salida = entrada + timedelta(hours=horas_jornada)
                registro = RegistroAsistencia(empleado_id=uuid.UUID(emp_id), hora_entrada=entrada, hora_salida=salida, origen="MANUAL")
                registro.calcular_horas()
                db.add(registro)

        # Miguel (por horas) depende 100% de horas registradas
        emp_id = empleados["Miguel Ozuna"]
        for dias_atras, horas in [(1, 8), (2, 8), (3, 6), (6, 8), (7, 8)]:
            dia = date.today() - timedelta(days=dias_atras)
            entrada = datetime.combine(dia, datetime.min.time(), tzinfo=timezone.utc).replace(hour=8)
            salida = entrada + timedelta(hours=horas)
            registro = RegistroAsistencia(empleado_id=uuid.UUID(emp_id), hora_entrada=entrada, hora_salida=salida, origen="MANUAL")
            registro.calcular_horas()
            db.add(registro)
        db.commit()
    finally:
        db.close()
    print("Historial de asistencia sembrado (ultimos 7 dias, con horas extra en un par de dias)")

    # --- Solicitudes de permiso ---
    pendiente = _check(
        client.post(
            "/api/v1/asistencia/permisos",
            json={
                "empleado_id": empleados["Maria Rodriguez"],
                "tipo": "VACACIONES",
                "fecha_inicio": (date.today() + timedelta(days=10)).isoformat(),
                "fecha_fin": (date.today() + timedelta(days=14)).isoformat(),
                "motivo": "Viaje familiar",
            },
            headers=admin,
        ),
        "crear solicitud pendiente",
    ).json()

    aprobada = _check(
        client.post(
            "/api/v1/asistencia/permisos",
            json={
                "empleado_id": empleados["Carlos Mendez"],
                "tipo": "PERSONAL",
                "fecha_inicio": (date.today() - timedelta(days=5)).isoformat(),
                "fecha_fin": (date.today() - timedelta(days=5)).isoformat(),
                "motivo": "Diligencia personal",
            },
            headers=admin,
        ),
        "crear solicitud a aprobar",
    ).json()
    _check(client.patch(f"/api/v1/asistencia/permisos/{aprobada['id']}/aprobar", headers=admin), "aprobar solicitud")

    rechazada = _check(
        client.post(
            "/api/v1/asistencia/permisos",
            json={
                "empleado_id": empleados["Pedro Reyes"],
                "tipo": "ENFERMEDAD",
                "fecha_inicio": (date.today() - timedelta(days=20)).isoformat(),
                "fecha_fin": (date.today() - timedelta(days=18)).isoformat(),
                "motivo": "Gripe",
            },
            headers=admin,
        ),
        "crear solicitud a rechazar",
    ).json()
    _check(
        client.patch(
            f"/api/v1/asistencia/permisos/{rechazada['id']}/rechazar",
            json={"motivo": "No se presento certificado medico"},
            headers=admin,
        ),
        "rechazar solicitud",
    )
    print("3 solicitudes de permiso creadas (1 pendiente, 1 aprobada, 1 rechazada)")

    # --- Nomina: periodo abierto listo para procesar en vivo durante la demo ---
    periodo = _check(
        client.post(
            "/api/v1/nomina/periodos",
            json={
                "fecha_inicio": (date.today() - timedelta(days=14)).isoformat(),
                "fecha_fin": date.today().isoformat(),
            },
            headers=admin,
        ),
        "crear periodo de nomina",
    ).json()
    print(f"Periodo de nomina creado (Abierto): {periodo['fecha_inicio']} a {periodo['fecha_fin']} - listo para 'Procesar' en la demo")

    # --- Reclutamiento ---
    v1 = _check(
        client.post(
            "/api/v1/vacantes",
            json={
                "titulo": "Ejecutivo de Ventas Senior",
                "descripcion": "Atencion a cuentas corporativas en la sucursal Piantini.",
                "departamento_id": departamentos["Ventas"],
                "sucursal_id": sucursales["Sucursal Piantini"],
                "numero_posiciones": 1,
            },
            headers=admin,
        ),
        "crear vacante 1",
    ).json()
    _check(client.post(f"/api/v1/vacantes/{v1['id']}/publicar", headers=admin), "publicar vacante 1")

    candidatos_v1 = [
        ("Jose", "Gomez", "jose.gomez.demo@example.com"),
        ("Yolanda", "Perez", "yolanda.perez.demo@example.com"),
        ("Manuel", "Diaz", "manuel.diaz.demo@example.com"),
    ]
    postulaciones_v1 = []
    for nombres, apellidos, email in candidatos_v1:
        cand = _check(
            client.post(
                "/api/v1/candidatos",
                data={"nombres": nombres, "apellidos": apellidos, "email": email},
                headers=admin,
            ),
            f"crear candidato {nombres}",
        ).json()
        post = _check(
            client.post(f"/api/v1/vacantes/{v1['id']}/postulaciones", json={"candidato_id": cand["id"]}, headers=admin),
            f"postular {nombres}",
        ).json()
        postulaciones_v1.append(post)

    # Candidato B: avanza a Entrevista con una entrevista agendada
    _check(
        client.patch(f"/api/v1/postulaciones/{postulaciones_v1[1]['id']}/estado", json={"estado": "EN_FILTRO"}, headers=admin),
        "avanzar postulacion B a en_filtro",
    )
    _check(
        client.patch(f"/api/v1/postulaciones/{postulaciones_v1[1]['id']}/estado", json={"estado": "ENTREVISTA"}, headers=admin),
        "avanzar postulacion B a entrevista",
    )
    _check(
        client.post(
            f"/api/v1/postulaciones/{postulaciones_v1[1]['id']}/entrevistas",
            json={
                "entrevistador_id": supervisor["id"],
                "fecha_hora": (datetime.now(timezone.utc) + timedelta(days=3)).isoformat(),
                "modalidad": "VIRTUAL",
                "comentarios": "Entrevista tecnica inicial",
            },
            headers=admin,
        ),
        "agendar entrevista",
    )

    # Candidato C: avanza hasta Oferta (queda lista para "Contratar" en vivo durante la demo)
    _check(
        client.patch(f"/api/v1/postulaciones/{postulaciones_v1[2]['id']}/estado", json={"estado": "EN_FILTRO"}, headers=admin),
        "avanzar postulacion C a en_filtro",
    )
    _check(
        client.patch(f"/api/v1/postulaciones/{postulaciones_v1[2]['id']}/estado", json={"estado": "ENTREVISTA"}, headers=admin),
        "avanzar postulacion C a entrevista",
    )
    _check(
        client.patch(f"/api/v1/postulaciones/{postulaciones_v1[2]['id']}/estado", json={"estado": "OFERTA"}, headers=admin),
        "avanzar postulacion C a oferta",
    )

    # Vacante 2: en Borrador (para mostrar el boton "Publicar")
    _check(
        client.post(
            "/api/v1/vacantes",
            json={
                "titulo": "Desarrollador Backend Jr.",
                "descripcion": "Vacante nueva, pendiente de publicar.",
                "departamento_id": departamentos["Tecnologia"],
                "sucursal_id": sucursales["Sucursal Santiago"],
                "numero_posiciones": 2,
            },
            headers=admin,
        ),
        "crear vacante 2 (borrador)",
    )

    # Vacante 3: ciclo completo ya cerrado (contratado + vacante cerrada)
    v3 = _check(
        client.post(
            "/api/v1/vacantes",
            json={
                "titulo": "Analista de RRHH",
                "descripcion": "Posicion ya cubierta - ejemplo de proceso completo.",
                "departamento_id": departamentos["Recursos Humanos"],
                "sucursal_id": sucursales["Sucursal Piantini"],
                "numero_posiciones": 1,
            },
            headers=admin,
        ),
        "crear vacante 3",
    ).json()
    _check(client.post(f"/api/v1/vacantes/{v3['id']}/publicar", headers=admin), "publicar vacante 3")
    cand3 = _check(
        client.post(
            "/api/v1/candidatos",
            data={"nombres": "Fernanda", "apellidos": "Cruz", "email": "fernanda.cruz.demo@example.com"},
            headers=admin,
        ),
        "crear candidata Fernanda",
    ).json()
    post3 = _check(
        client.post(f"/api/v1/vacantes/{v3['id']}/postulaciones", json={"candidato_id": cand3["id"]}, headers=admin),
        "postular Fernanda",
    ).json()
    for estado in ["EN_FILTRO", "ENTREVISTA", "OFERTA"]:
        _check(
            client.patch(f"/api/v1/postulaciones/{post3['id']}/estado", json={"estado": estado}, headers=admin),
            f"avanzar Fernanda a {estado}",
        )
    _check(
        client.post(
            f"/api/v1/postulaciones/{post3['id']}/contratar",
            json={
                "cedula_o_dni": "001-1010101-0",
                "fecha_nacimiento": "1995-04-22",
                "fecha_ingreso": date.today().isoformat(),
                "puesto_id": puestos["Reclutador"],
                "tipo_contrato": "INDEFINIDO",
                "salario": 34000,
            },
            headers=admin,
        ),
        "contratar a Fernanda",
    )
    _check(client.post(f"/api/v1/vacantes/{v3['id']}/cerrar", headers=admin), "cerrar vacante 3")
    print("Reclutamiento: 3 vacantes (publicada con pipeline completo, borrador, y una ya cerrada/contratada)")

    # --- Desempeno ---
    ciclo = _check(
        client.post(
            "/api/v1/ciclos-evaluacion",
            json={"nombre": "Evaluacion Semestral 2026-H1", "fecha_inicio": "2026-01-01", "fecha_fin": "2026-06-30"},
            headers=admin,
        ),
        "crear ciclo de evaluacion",
    ).json()

    obj1 = _check(
        client.post(
            "/api/v1/objetivos",
            json={"empleado_id": empleados["Maria Rodriguez"], "ciclo_id": ciclo["id"], "descripcion": "Cerrar 100 ventas en el semestre", "meta_valor": 100},
            headers=admin,
        ),
        "crear objetivo Maria",
    ).json()
    _check(client.patch(f"/api/v1/objetivos/{obj1['id']}/avance", json={"valor_actual": 72}, headers=admin), "avance objetivo Maria")

    obj2 = _check(
        client.post(
            "/api/v1/objetivos",
            json={"empleado_id": empleados["Ana Familia"], "ciclo_id": ciclo["id"], "descripcion": "Entregar 10 mejoras al sistema interno", "meta_valor": 10},
            headers=admin,
        ),
        "crear objetivo Ana",
    ).json()
    _check(client.patch(f"/api/v1/objetivos/{obj2['id']}/avance", json={"valor_actual": 10}, headers=admin), "avance objetivo Ana")

    _check(
        client.post(
            "/api/v1/evaluaciones",
            json={
                "empleado_id": empleados["Maria Rodriguez"],
                "evaluador_id": supervisor["id"],
                "ciclo_id": ciclo["id"],
                "calificacion_final": 85,
                "comentarios": "Excelente desempeno en el trimestre.",
            },
            headers=admin,
        ),
        "crear evaluacion Maria",
    )
    _check(
        client.post(
            "/api/v1/evaluaciones",
            json={
                "empleado_id": empleados["Luis Objio"],
                "evaluador_id": supervisor["id"],
                "ciclo_id": ciclo["id"],
                "calificacion_final": 58,
                "comentarios": "Necesita mejorar cumplimiento de plazos.",
                "plan_mejora": "Seguimiento semanal con su supervisor durante 2 meses.",
            },
            headers=admin,
        ),
        "crear evaluacion Luis",
    )
    print("Desempeno: 1 ciclo, 2 objetivos con avance, 2 evaluaciones (una alta, una baja)")

    # --- Capacitacion ---
    cursos_def = [
        ("Induccion Corporativa", True, 8),
        ("Excel Avanzado", False, 16),
        ("Liderazgo para Supervisores", True, 20),
    ]
    cursos = {}
    for nombre, obligatorio, horas in cursos_def:
        c = _check(
            client.post(
                "/api/v1/capacitacion/cursos",
                json={"nombre": nombre, "obligatorio": obligatorio, "duracion_horas": horas},
                headers=admin,
            ),
            f"crear curso {nombre}",
        ).json()
        cursos[nombre] = c["id"]

    insc1 = _check(
        client.post(
            f"/api/v1/capacitacion/cursos/{cursos['Induccion Corporativa']}/inscribir",
            json={"empleado_id": empleados["Maria Rodriguez"]},
            headers=admin,
        ),
        "inscribir Maria en Induccion",
    ).json()
    _check(
        client.patch(f"/api/v1/capacitacion/inscripciones/{insc1['id']}/progreso", json={"progreso": 100}, headers=admin),
        "completar curso de Maria",
    )

    insc2 = _check(
        client.post(
            f"/api/v1/capacitacion/cursos/{cursos['Excel Avanzado']}/inscribir",
            json={"empleado_id": empleados["Ana Familia"]},
            headers=admin,
        ),
        "inscribir Ana en Excel",
    ).json()
    _check(
        client.patch(f"/api/v1/capacitacion/inscripciones/{insc2['id']}/progreso", json={"progreso": 45}, headers=admin),
        "avance curso de Ana",
    )

    _check(
        client.post(
            f"/api/v1/capacitacion/cursos/{cursos['Liderazgo para Supervisores']}/inscribir",
            json={"empleado_id": empleados["Carlos Mendez"]},
            headers=admin,
        ),
        "inscribir Carlos en Liderazgo",
    )
    print("Capacitacion: 3 cursos, 3 inscripciones (una completada con certificado, una en progreso, una recien iniciada)")

    # =========================================================================
    # Casos adicionales para una demo mas robusta
    # =========================================================================

    # --- C. Periodo de nomina historico ya CERRADO (mes anterior) ---
    # Se procesa ANTES del aumento de Ana (seccion A) para que su contrato
    # original, todavia VIGENTE en este punto, se use correctamente en ese periodo.
    inicio_hist = date.today() - timedelta(days=44)
    fin_hist = date.today() - timedelta(days=30)
    db = SessionLocal()
    try:
        for nombre in ["Maria Rodriguez", "Carlos Mendez", "Ana Familia", "Luis Objio", "Julissa Tavarez"]:
            emp_id = uuid.UUID(empleados[nombre])
            for offset in [2, 5, 9, 12]:
                dia = fin_hist - timedelta(days=offset)
                entrada = datetime.combine(dia, datetime.min.time(), tzinfo=timezone.utc).replace(hour=8)
                salida = entrada + timedelta(hours=8)
                registro = RegistroAsistencia(empleado_id=emp_id, hora_entrada=entrada, hora_salida=salida, origen="MANUAL")
                registro.calcular_horas()
                db.add(registro)
        db.commit()
    finally:
        db.close()

    periodo_hist = _check(
        client.post(
            "/api/v1/nomina/periodos",
            json={"fecha_inicio": inicio_hist.isoformat(), "fecha_fin": fin_hist.isoformat()},
            headers=admin,
        ),
        "crear periodo historico",
    ).json()
    resultado_hist = _check(
        client.post(f"/api/v1/nomina/periodos/{periodo_hist['id']}/procesar", headers=admin),
        "procesar periodo historico",
    ).json()
    _check(client.post(f"/api/v1/nomina/periodos/{periodo_hist['id']}/cerrar", headers=admin), "cerrar periodo historico")
    print(
        f"Nomina: periodo historico ({inicio_hist} a {fin_hist}) creado, procesado y CERRADO "
        f"({resultado_hist['nominas_generadas']} nominas) - volantes ya descargables de inmediato"
    )

    # --- A. Historial de contratos: aumento salarial de Ana Familia ---
    expediente_ana = _check(
        client.get(f"/api/v1/empleados/{empleados['Ana Familia']}/expediente", headers=admin),
        "obtener expediente de Ana",
    ).json()
    contrato_actual_ana = expediente_ana["contratos"][0]  # el mas reciente
    _check(
        client.patch(
            f"/api/v1/contratos/{contrato_actual_ana['id']}",
            json={"estado": "FINALIZADO", "fecha_fin": (date.today() - timedelta(days=1)).isoformat()},
            headers=admin,
        ),
        "finalizar contrato anterior de Ana",
    )
    _check(
        client.post(
            f"/api/v1/empleados/{empleados['Ana Familia']}/contratos",
            json={"tipo": "INDEFINIDO", "fecha_inicio": date.today().isoformat(), "salario": 62000},
            headers=admin,
        ),
        "crear contrato con aumento para Ana",
    )
    print("Expediente Digital: Ana Familia tiene un contrato anterior FINALIZADO y uno VIGENTE con aumento (RD$55,000 -> RD$62,000)")

    # --- B. Mas empleados para activar la paginacion (la lista usa PAGE_SIZE=10) ---
    empleados_extra_def = [
        ("Rafael", "Nunez", "002-1010101-1", "1991-04-10", hace_1_anio, "Ejecutivo de Ventas", "Sucursal Santiago", "Ventas", "INDEFINIDO", 35000),
        ("Yesenia", "Almonte", "002-2020202-2", "1997-08-19", hace_6_meses, "Analista de Soporte TI", "Sucursal Piantini", "Tecnologia", "TEMPORAL", 32000),
        ("Hector", "Vargas", "002-3030303-3", "1989-01-05", hace_2_anios, "Coordinador de Operaciones", "Sucursal Piantini", "Operaciones", "INDEFINIDO", 39000),
        ("Diana", "Sosa", "002-4040404-4", "1995-10-27", hace_3_meses, "Reclutador", "Sucursal Bavaro", "Recursos Humanos", "PRACTICA", 15000),
        ("Wilson", "Feliz", "002-5050505-5", "1986-06-15", hace_1_anio, "Auxiliar de Almacen", "Sucursal Santiago", "Operaciones", "POR_HORAS", 24000),
        ("Katherine", "Reynoso", "002-6060606-6", "1993-12-02", hace_6_meses, "Desarrollador de Software", "Sucursal Piantini", "Tecnologia", "INDEFINIDO", 58000),
    ]
    for (nombres, apellidos, cedula, fnac, fing, puesto, sucursal, depto, tipo, salario) in empleados_extra_def:
        emp = _check(
            client.post(
                "/api/v1/empleados",
                json={
                    "nombres": nombres,
                    "apellidos": apellidos,
                    "cedula_o_dni": cedula,
                    "fecha_nacimiento": fnac,
                    "fecha_ingreso": fing,
                    "puesto_id": puestos[puesto],
                    "sucursal_id": sucursales[sucursal],
                    "departamento_id": departamentos[depto],
                },
                headers=admin,
            ),
            f"crear empleado extra {nombres}",
        ).json()
        empleados[f"{nombres} {apellidos}"] = emp["id"]
        _check(
            client.post(
                f"/api/v1/empleados/{emp['id']}/contratos",
                json={"tipo": tipo, "fecha_inicio": fing, "salario": salario},
                headers=admin,
            ),
            f"crear contrato de {nombres}",
        )
    total_empleados = _check(client.get("/api/v1/empleados?page=1&size=1", headers=admin), "contar empleados").json()["total"]
    print(f"Empleados: {len(empleados_extra_def)} adicionales creados (total {total_empleados}) - ya se activa la paginacion (2 paginas)")

    # --- D. Postulacion rechazada (falta ese estado en el pipeline sembrado) ---
    cand_rechazado = _check(
        client.post(
            "/api/v1/candidatos",
            data={"nombres": "Ruben", "apellidos": "Castillo", "email": "ruben.castillo.demo@example.com"},
            headers=admin,
        ),
        "crear candidato a rechazar",
    ).json()
    post_rechazado = _check(
        client.post(f"/api/v1/vacantes/{v1['id']}/postulaciones", json={"candidato_id": cand_rechazado["id"]}, headers=admin),
        "postular candidato a rechazar",
    ).json()
    _check(
        client.post(
            f"/api/v1/postulaciones/{post_rechazado['id']}/rechazar",
            json={"motivo": "El perfil no cumple con la experiencia minima requerida"},
            headers=admin,
        ),
        "rechazar postulacion",
    )
    print("Reclutamiento: se agrego una postulacion en estado Rechazada (con motivo) en la vacante Ejecutivo de Ventas Senior")

    # --- E. Segundo ciclo de evaluacion, anterior, para ver historial multi-ciclo ---
    ciclo_anterior = _check(
        client.post(
            "/api/v1/ciclos-evaluacion",
            json={"nombre": "Evaluacion Anual 2025", "fecha_inicio": "2025-01-01", "fecha_fin": "2025-12-31"},
            headers=admin,
        ),
        "crear ciclo anterior",
    ).json()
    obj_hist = _check(
        client.post(
            "/api/v1/objetivos",
            json={
                "empleado_id": empleados["Maria Rodriguez"],
                "ciclo_id": ciclo_anterior["id"],
                "descripcion": "Cerrar 80 ventas en el 2025",
                "meta_valor": 80,
            },
            headers=admin,
        ),
        "crear objetivo historico de Maria",
    ).json()
    _check(
        client.patch(f"/api/v1/objetivos/{obj_hist['id']}/avance", json={"valor_actual": 80}, headers=admin),
        "avance objetivo historico de Maria",
    )
    _check(
        client.post(
            "/api/v1/evaluaciones",
            json={
                "empleado_id": empleados["Maria Rodriguez"],
                "evaluador_id": supervisor["id"],
                "ciclo_id": ciclo_anterior["id"],
                "calificacion_final": 78,
                "comentarios": "Buen desempeno general durante el 2025.",
            },
            headers=admin,
        ),
        "crear evaluacion historica de Maria",
    )
    _check(
        client.post(
            "/api/v1/evaluaciones",
            json={
                "empleado_id": empleados["Carlos Mendez"],
                "evaluador_id": supervisor["id"],
                "ciclo_id": ciclo_anterior["id"],
                "calificacion_final": 90,
                "comentarios": "Desempeno sobresaliente, supero las metas de su equipo.",
            },
            headers=admin,
        ),
        "crear evaluacion historica de Carlos",
    )
    print("Desempeno: agregado un ciclo anterior (2025) con objetivo/evaluaciones - Maria Rodriguez ya tiene historial en 2 ciclos")

    # --- F. Mas variedad de progreso en Capacitacion ---
    insc_extra = _check(
        client.post(
            f"/api/v1/capacitacion/cursos/{cursos['Induccion Corporativa']}/inscribir",
            json={"empleado_id": empleados["Carmen Pena"]},
            headers=admin,
        ),
        "inscribir Carmen en Induccion",
    ).json()
    _check(
        client.patch(f"/api/v1/capacitacion/inscripciones/{insc_extra['id']}/progreso", json={"progreso": 20}, headers=admin),
        "avance minimo de Carmen",
    )
    print("Capacitacion: agregada una inscripcion adicional con progreso apenas iniciado (20%)")

    print("\n=== Listo. Credenciales de demo ===")
    for email, password, rol in credenciales_creadas:
        print(f"  {rol:12s} {email}  /  {password}")
    print(f"\nEmpleado con cuenta ESS y curso/evaluacion/objetivo completos para mostrar 'Mi espacio': empleado1.demo@talento360.com")
    print("Periodo de nomina 'Abierto' (ultimos 14 dias) listo para procesar en vivo desde la pantalla de Nomina.")
    print("Periodo de nomina anterior ya 'Cerrado' con volantes de pago descargables de inmediato.")
    print("Postulacion en estado 'Oferta' en la vacante 'Ejecutivo de Ventas Senior' lista para 'Contratar' en vivo.")
    print("Postulacion 'Rechazada' de ejemplo en la misma vacante.")
    print("Ana Familia tiene historial de 2 contratos (uno finalizado, uno vigente con aumento).")
    print("Maria Rodriguez tiene evaluaciones/objetivos en 2 ciclos distintos (2025 y 2026).")
    print(f"{total_empleados} empleados en total: la lista de Empleados ya muestra 2 paginas.")


if __name__ == "__main__":
    main()
