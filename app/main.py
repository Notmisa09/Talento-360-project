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


@app.get("/health", tags=["Health"])
def health() -> dict[str, str]:
    return {"status": "ok"}
