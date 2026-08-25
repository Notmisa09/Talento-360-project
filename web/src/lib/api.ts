import { authStorage } from "@/lib/auth-storage"
import type {
  CandidatoOut,
  ContratarPostulacionRequest,
  ContratoCreate,
  ContratoOut,
  DatosLegalesOut,
  DatosLegalesUpsert,
  DepartamentoCreate,
  DepartamentoOut,
  EmpleadoCreate,
  EmpleadoOut,
  EmpleadoUpdate,
  EntrevistaCreate,
  EntrevistaOut,
  ExpedienteOut,
  PaginatedResponse,
  PostulacionOut,
  PuestoCreate,
  PuestoOut,
  SucursalCreate,
  SucursalOut,
  Token,
  UsuarioCreate,
  UsuarioOut,
  UsuarioUpdate,
  VacanteCreate,
  VacanteOut,
} from "@/lib/types"

const API_BASE = "/api/v1"

export class ApiError extends Error {
  status: number
  code?: string

  constructor(message: string, status: number, code?: string) {
    super(message)
    this.status = status
    this.code = code
  }
}

async function parseErrorBody(res: Response): Promise<{ detail?: unknown; code?: string }> {
  try {
    return await res.json()
  } catch {
    return {}
  }
}

function detailToMessage(detail: unknown, fallback: string): string {
  if (typeof detail === "string") return detail
  if (Array.isArray(detail)) {
    // Errores de validacion de FastAPI/Pydantic: [{ msg, loc, ... }, ...]
    return detail.map((item) => (typeof item?.msg === "string" ? item.msg : fallback)).join(" ")
  }
  return fallback
}

export async function login(email: string, password: string): Promise<Token> {
  const body = new URLSearchParams()
  body.set("username", email)
  body.set("password", password)

  const res = await fetch(`${API_BASE}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  })

  if (!res.ok) {
    const err = await parseErrorBody(res)
    throw new ApiError(detailToMessage(err.detail, "No se pudo iniciar sesion"), res.status, err.code)
  }

  return res.json()
}

export async function me(accessToken: string): Promise<UsuarioOut> {
  const res = await fetch(`${API_BASE}/auth/me`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  })

  if (!res.ok) {
    const err = await parseErrorBody(res)
    throw new ApiError(detailToMessage(err.detail, "No se pudo obtener el usuario"), res.status, err.code)
  }

  return res.json()
}

async function authorizedRequest<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = authStorage.getAccessToken()

  const isFormData = options.body instanceof FormData

  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      ...(options.body && !isFormData ? { "Content-Type": "application/json" } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  })

  if (!res.ok) {
    const err = await parseErrorBody(res)
    throw new ApiError(detailToMessage(err.detail, "Ocurrio un error inesperado"), res.status, err.code)
  }

  if (res.status === 204) {
    return undefined as T
  }

  return res.json()
}

export async function listarUsuarios(page: number, size = 20): Promise<PaginatedResponse<UsuarioOut>> {
  return authorizedRequest(`/usuarios?page=${page}&size=${size}`)
}

export async function crearUsuario(data: UsuarioCreate): Promise<UsuarioOut> {
  return authorizedRequest("/usuarios", { method: "POST", body: JSON.stringify(data) })
}

export async function actualizarUsuario(usuarioId: string, data: UsuarioUpdate): Promise<UsuarioOut> {
  return authorizedRequest(`/usuarios/${usuarioId}`, { method: "PATCH", body: JSON.stringify(data) })
}

export async function desactivarUsuario(usuarioId: string): Promise<void> {
  return authorizedRequest(`/usuarios/${usuarioId}`, { method: "DELETE" })
}

export async function forgotPassword(email: string): Promise<void> {
  const res = await fetch(`${API_BASE}/auth/forgot-password`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email }),
  })

  if (!res.ok) {
    const err = await parseErrorBody(res)
    throw new ApiError(detailToMessage(err.detail, "No se pudo procesar la solicitud"), res.status, err.code)
  }
}

export async function resetPassword(token: string, passwordNuevo: string): Promise<void> {
  const res = await fetch(`${API_BASE}/auth/reset-password`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ token, password_nuevo: passwordNuevo }),
  })

  if (!res.ok) {
    const err = await parseErrorBody(res)
    throw new ApiError(
      detailToMessage(err.detail, "No se pudo restablecer la contrasena"),
      res.status,
      err.code
    )
  }
}

export async function listarSucursales(): Promise<SucursalOut[]> {
  return authorizedRequest("/sucursales")
}

export async function crearSucursal(data: SucursalCreate): Promise<SucursalOut> {
  return authorizedRequest("/sucursales", { method: "POST", body: JSON.stringify(data) })
}

export async function listarDepartamentos(): Promise<DepartamentoOut[]> {
  return authorizedRequest("/departamentos")
}

export async function crearDepartamento(data: DepartamentoCreate): Promise<DepartamentoOut> {
  return authorizedRequest("/departamentos", { method: "POST", body: JSON.stringify(data) })
}

export async function listarPuestos(departamentoId?: string): Promise<PuestoOut[]> {
  const query = departamentoId ? `?departamento_id=${departamentoId}` : ""
  return authorizedRequest(`/puestos${query}`)
}

export async function crearPuesto(data: PuestoCreate): Promise<PuestoOut> {
  return authorizedRequest("/puestos", { method: "POST", body: JSON.stringify(data) })
}

export async function listarEmpleados(
  page: number,
  size = 20,
  opts?: { estado?: string; departamentoId?: string; q?: string }
): Promise<PaginatedResponse<EmpleadoOut>> {
  const params = new URLSearchParams({ page: String(page), size: String(size) })
  if (opts?.estado) params.set("estado", opts.estado)
  if (opts?.departamentoId) params.set("departamento_id", opts.departamentoId)
  if (opts?.q) params.set("q", opts.q)
  return authorizedRequest(`/empleados?${params.toString()}`)
}

export async function crearEmpleado(data: EmpleadoCreate): Promise<EmpleadoOut> {
  return authorizedRequest("/empleados", { method: "POST", body: JSON.stringify(data) })
}

export async function actualizarEmpleado(empleadoId: string, data: EmpleadoUpdate): Promise<EmpleadoOut> {
  return authorizedRequest(`/empleados/${empleadoId}`, { method: "PATCH", body: JSON.stringify(data) })
}

export async function cambiarEstadoEmpleado(empleadoId: string, estado: string): Promise<EmpleadoOut> {
  return authorizedRequest(`/empleados/${empleadoId}/estado`, {
    method: "PATCH",
    body: JSON.stringify({ estado }),
  })
}

export async function obtenerExpediente(empleadoId: string): Promise<ExpedienteOut> {
  return authorizedRequest(`/empleados/${empleadoId}/expediente`)
}

export async function guardarDatosLegales(empleadoId: string, data: DatosLegalesUpsert): Promise<DatosLegalesOut> {
  return authorizedRequest(`/empleados/${empleadoId}/datos-legales`, { method: "PUT", body: JSON.stringify(data) })
}

export async function crearContrato(empleadoId: string, data: ContratoCreate): Promise<ContratoOut> {
  return authorizedRequest(`/empleados/${empleadoId}/contratos`, {
    method: "POST",
    body: JSON.stringify(data),
  })
}

export async function cargarDocumento(
  empleadoId: string,
  tipo: string,
  archivo: File
): Promise<{ id: string; nombre_archivo: string }> {
  const form = new FormData()
  form.set("tipo", tipo)
  form.set("archivo", archivo)
  return authorizedRequest(`/empleados/${empleadoId}/documentos`, { method: "POST", body: form })
}

export async function descargarDocumento(empleadoId: string, documentoId: string, nombreArchivo: string): Promise<void> {
  const token = authStorage.getAccessToken()
  const res = await fetch(`${API_BASE}/empleados/${empleadoId}/documentos/${documentoId}/descargar`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  })

  if (!res.ok) {
    const err = await parseErrorBody(res)
    throw new ApiError(detailToMessage(err.detail, "No se pudo descargar el documento"), res.status, err.code)
  }

  const blob = await res.blob()
  const url = URL.createObjectURL(blob)
  const link = document.createElement("a")
  link.href = url
  link.download = nombreArchivo
  link.click()
  URL.revokeObjectURL(url)
}

export async function listarVacantes(
  page: number,
  size = 20,
  opts?: { estado?: string; departamentoId?: string }
): Promise<PaginatedResponse<VacanteOut>> {
  const params = new URLSearchParams({ page: String(page), size: String(size) })
  if (opts?.estado) params.set("estado", opts.estado)
  if (opts?.departamentoId) params.set("departamento_id", opts.departamentoId)
  return authorizedRequest(`/vacantes?${params.toString()}`)
}

export async function crearVacante(data: VacanteCreate): Promise<VacanteOut> {
  return authorizedRequest("/vacantes", { method: "POST", body: JSON.stringify(data) })
}

export async function publicarVacante(vacanteId: string): Promise<VacanteOut> {
  return authorizedRequest(`/vacantes/${vacanteId}/publicar`, { method: "POST" })
}

export async function cerrarVacante(vacanteId: string): Promise<VacanteOut> {
  return authorizedRequest(`/vacantes/${vacanteId}/cerrar`, { method: "POST" })
}

export async function listarPostulacionesDeVacante(vacanteId: string): Promise<PostulacionOut[]> {
  return authorizedRequest(`/vacantes/${vacanteId}/postulaciones`)
}

export async function postularCandidato(vacanteId: string, candidatoId: string): Promise<PostulacionOut> {
  return authorizedRequest(`/vacantes/${vacanteId}/postulaciones`, {
    method: "POST",
    body: JSON.stringify({ candidato_id: candidatoId }),
  })
}

export async function listarCandidatos(page: number, size = 20): Promise<PaginatedResponse<CandidatoOut>> {
  return authorizedRequest(`/candidatos?page=${page}&size=${size}`)
}

export async function crearCandidato(data: {
  nombres: string
  apellidos: string
  email: string
  telefono?: string | null
  linkedin?: string | null
  cv?: File | null
}): Promise<CandidatoOut> {
  const form = new FormData()
  form.set("nombres", data.nombres)
  form.set("apellidos", data.apellidos)
  form.set("email", data.email)
  if (data.telefono) form.set("telefono", data.telefono)
  if (data.linkedin) form.set("linkedin", data.linkedin)
  if (data.cv) form.set("cv", data.cv)
  return authorizedRequest("/candidatos", { method: "POST", body: form })
}

export async function cambiarEstadoPostulacion(postulacionId: string, estado: string): Promise<PostulacionOut> {
  return authorizedRequest(`/postulaciones/${postulacionId}/estado`, {
    method: "PATCH",
    body: JSON.stringify({ estado }),
  })
}

export async function rechazarPostulacion(postulacionId: string, motivo: string | null): Promise<PostulacionOut> {
  return authorizedRequest(`/postulaciones/${postulacionId}/rechazar`, {
    method: "POST",
    body: JSON.stringify({ motivo }),
  })
}

export async function agendarEntrevista(postulacionId: string, data: EntrevistaCreate): Promise<EntrevistaOut> {
  return authorizedRequest(`/postulaciones/${postulacionId}/entrevistas`, {
    method: "POST",
    body: JSON.stringify(data),
  })
}

export async function listarEntrevistas(postulacionId: string): Promise<EntrevistaOut[]> {
  return authorizedRequest(`/postulaciones/${postulacionId}/entrevistas`)
}

export async function contratarPostulacion(
  postulacionId: string,
  data: ContratarPostulacionRequest
): Promise<EmpleadoOut> {
  return authorizedRequest(`/postulaciones/${postulacionId}/contratar`, {
    method: "POST",
    body: JSON.stringify(data),
  })
}

export async function refresh(refreshToken: string): Promise<Token> {
  const res = await fetch(`${API_BASE}/auth/refresh`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refresh_token: refreshToken }),
  })

  if (!res.ok) {
    const err = await parseErrorBody(res)
    throw new ApiError(detailToMessage(err.detail, "No se pudo renovar la sesion"), res.status, err.code)
  }

  return res.json()
}
