from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.core.exceptions import register_exception_handlers
from app.modules.auth.router import auth_router, usuarios_router
from app.modules.empleados.router import (
    contratos_router,
    departamentos_router,
    empleados_router,
    puestos_router,
    sucursales_router,
)
from app.modules.reclutamiento.router import (
    candidatos_router,
    entrevistas_router,
    postulaciones_router,
    vacantes_router,
)
from app.modules.desempeno.router import (
    ciclos_evaluacion_router,
    desempeno_router,
    evaluaciones_router,
    objetivos_router,
)
from app.modules.asistencia.router import asistencia_router
from app.modules.nomina.router import nominas_router, periodos_nomina_router
from app.modules.capacitacion.router import capacitacion_router, cursos_router, inscripciones_router
from app.modules.autoservicio.router import autoservicio_router

app = FastAPI(title=settings.PROJECT_NAME, openapi_url=f"{settings.API_V1_PREFIX}/openapi.json")

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

register_exception_handlers(app)

app.include_router(auth_router, prefix=settings.API_V1_PREFIX)
app.include_router(usuarios_router, prefix=settings.API_V1_PREFIX)
app.include_router(sucursales_router, prefix=settings.API_V1_PREFIX)
app.include_router(departamentos_router, prefix=settings.API_V1_PREFIX)
app.include_router(puestos_router, prefix=settings.API_V1_PREFIX)
app.include_router(empleados_router, prefix=settings.API_V1_PREFIX)
app.include_router(contratos_router, prefix=settings.API_V1_PREFIX)
app.include_router(vacantes_router, prefix=settings.API_V1_PREFIX)
app.include_router(candidatos_router, prefix=settings.API_V1_PREFIX)
app.include_router(postulaciones_router, prefix=settings.API_V1_PREFIX)
app.include_router(entrevistas_router, prefix=settings.API_V1_PREFIX)
app.include_router(ciclos_evaluacion_router, prefix=settings.API_V1_PREFIX)
app.include_router(objetivos_router, prefix=settings.API_V1_PREFIX)
app.include_router(evaluaciones_router, prefix=settings.API_V1_PREFIX)
app.include_router(desempeno_router, prefix=settings.API_V1_PREFIX)
app.include_router(asistencia_router, prefix=settings.API_V1_PREFIX)
app.include_router(periodos_nomina_router, prefix=settings.API_V1_PREFIX)
app.include_router(nominas_router, prefix=settings.API_V1_PREFIX)
app.include_router(cursos_router, prefix=settings.API_V1_PREFIX)
app.include_router(inscripciones_router, prefix=settings.API_V1_PREFIX)
app.include_router(capacitacion_router, prefix=settings.API_V1_PREFIX)
app.include_router(autoservicio_router, prefix=settings.API_V1_PREFIX)


@app.get("/health", tags=["Health"])
def health() -> dict[str, str]:
    return {"status": "ok"}
