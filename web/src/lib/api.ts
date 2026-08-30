import { authStorage } from "@/lib/auth-storage"
import type {
  CandidatoOut,
  CicloEvaluacionCreate,
  CicloEvaluacionOut,
  ContratarPostulacionRequest,
  ContratoCreate,
  ContratoOut,
  CursoCreate,
  CursoOut,
  DatosLegalesOut,
  DatosLegalesUpsert,
  DepartamentoCreate,
  DepartamentoOut,
  DepartamentoUpdate,
  EmpleadoCreate,
  EmpleadoOut,
  EmpleadoUpdate,
  EntrevistaCreate,
  EntrevistaOut,
  EvaluacionCreate,
  EvaluacionOut,
  ExpedienteOut,
  HistorialDesempenoOut,
  InscripcionOut,
  NominaDetalleOut,
  NominaOut,
  ObjetivoCreate,
  ObjetivoOut,
  PaginatedResponse,
  PeriodoNominaCreate,
  PeriodoNominaOut,
  PostulacionOut,
  ProcesarPeriodoResultadoOut,
  PuestoCreate,
  PuestoOut,
  PuestoUpdate,
  RegistroAsistenciaOut,
  ResumenAsistenciaOut,
  SaldoVacacionesOut,
  SolicitudPermisoCreate,
  SolicitudPermisoOut,
  SucursalCreate,
  SucursalOut,
  SucursalUpdate,
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

export async function actualizarSucursal(sucursalId: string, data: SucursalUpdate): Promise<SucursalOut> {
  return authorizedRequest(`/sucursales/${sucursalId}`, { method: "PATCH", body: JSON.stringify(data) })
}

export async function eliminarSucursal(sucursalId: string): Promise<void> {
  return authorizedRequest(`/sucursales/${sucursalId}`, { method: "DELETE" })
}

export async function listarDepartamentos(): Promise<DepartamentoOut[]> {
  return authorizedRequest("/departamentos")
}

export async function crearDepartamento(data: DepartamentoCreate): Promise<DepartamentoOut> {
  return authorizedRequest("/departamentos", { method: "POST", body: JSON.stringify(data) })
}

export async function actualizarDepartamento(
  departamentoId: string,
  data: DepartamentoUpdate
): Promise<DepartamentoOut> {
  return authorizedRequest(`/departamentos/${departamentoId}`, { method: "PATCH", body: JSON.stringify(data) })
}

export async function eliminarDepartamento(departamentoId: string): Promise<void> {
  return authorizedRequest(`/departamentos/${departamentoId}`, { method: "DELETE" })
}

export async function listarPuestos(departamentoId?: string): Promise<PuestoOut[]> {
  const query = departamentoId ? `?departamento_id=${departamentoId}` : ""
  return authorizedRequest(`/puestos${query}`)
}

export async function crearPuesto(data: PuestoCreate): Promise<PuestoOut> {
  return authorizedRequest("/puestos", { method: "POST", body: JSON.stringify(data) })
}

export async function actualizarPuesto(puestoId: string, data: PuestoUpdate): Promise<PuestoOut> {
  return authorizedRequest(`/puestos/${puestoId}`, { method: "PATCH", body: JSON.stringify(data) })
}

export async function eliminarPuesto(puestoId: string): Promise<void> {
  return authorizedRequest(`/puestos/${puestoId}`, { method: "DELETE" })
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

async function descargarBlob(path: string, nombreArchivo: string): Promise<void> {
  const token = authStorage.getAccessToken()
  const res = await fetch(`${API_BASE}${path}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  })

  if (!res.ok) {
    const err = await parseErrorBody(res)
    throw new ApiError(detailToMessage(err.detail, "No se pudo descargar el archivo"), res.status, err.code)
  }

  const blob = await res.blob()
  const url = URL.createObjectURL(blob)
  const link = document.createElement("a")
  link.href = url
  link.download = nombreArchivo
  link.click()
  URL.revokeObjectURL(url)
}

export async function descargarDocumento(empleadoId: string, documentoId: string, nombreArchivo: string): Promise<void> {
  return descargarBlob(`/empleados/${empleadoId}/documentos/${documentoId}/descargar`, nombreArchivo)
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

export async function listarCiclosEvaluacion(): Promise<CicloEvaluacionOut[]> {
  return authorizedRequest("/ciclos-evaluacion")
}

export async function crearCicloEvaluacion(data: CicloEvaluacionCreate): Promise<CicloEvaluacionOut> {
  return authorizedRequest("/ciclos-evaluacion", { method: "POST", body: JSON.stringify(data) })
}

export async function listarObjetivos(empleadoId: string): Promise<ObjetivoOut[]> {
  return authorizedRequest(`/objetivos?empleado_id=${empleadoId}`)
}

export async function crearObjetivo(data: ObjetivoCreate): Promise<ObjetivoOut> {
  return authorizedRequest("/objetivos", { method: "POST", body: JSON.stringify(data) })
}

export async function actualizarAvanceObjetivo(objetivoId: string, valorActual: number): Promise<ObjetivoOut> {
  return authorizedRequest(`/objetivos/${objetivoId}/avance`, {
    method: "PATCH",
    body: JSON.stringify({ valor_actual: valorActual }),
  })
}

export async function listarEvaluaciones(empleadoId: string): Promise<EvaluacionOut[]> {
  return authorizedRequest(`/evaluaciones?empleado_id=${empleadoId}`)
}

export async function crearEvaluacion(data: EvaluacionCreate): Promise<EvaluacionOut> {
  return authorizedRequest("/evaluaciones", { method: "POST", body: JSON.stringify(data) })
}

export async function obtenerHistorialDesempeno(empleadoId: string): Promise<HistorialDesempenoOut> {
  return authorizedRequest(`/desempeno/empleados/${empleadoId}/historial-desempeno`)
}

// --- Asistencia y Tiempo ---

export async function marcarEntrada(empleadoId: string, origen = "MANUAL"): Promise<RegistroAsistenciaOut> {
  return authorizedRequest("/asistencia/marcaje/entrada", {
    method: "POST",
    body: JSON.stringify({ empleado_id: empleadoId, origen }),
  })
}

export async function marcarSalida(empleadoId: string): Promise<RegistroAsistenciaOut> {
  return authorizedRequest("/asistencia/marcaje/salida", {
    method: "POST",
    body: JSON.stringify({ empleado_id: empleadoId }),
  })
}

export async function listarRegistrosAsistencia(
  empleadoId: string,
  opts?: { desde?: string; hasta?: string }
): Promise<RegistroAsistenciaOut[]> {
  const params = new URLSearchParams({ empleado_id: empleadoId })
  if (opts?.desde) params.set("desde", opts.desde)
  if (opts?.hasta) params.set("hasta", opts.hasta)
  return authorizedRequest(`/asistencia/registros?${params.toString()}`)
}

export async function obtenerResumenAsistencia(empleadoId: string, mes: string): Promise<ResumenAsistenciaOut> {
  return authorizedRequest(`/asistencia/empleados/${empleadoId}/resumen?mes=${mes}`)
}

export async function crearSolicitudPermiso(data: SolicitudPermisoCreate): Promise<SolicitudPermisoOut> {
  return authorizedRequest("/asistencia/permisos", { method: "POST", body: JSON.stringify(data) })
}

export async function listarSolicitudesPermiso(opts?: {
  empleadoId?: string
  estado?: string
}): Promise<SolicitudPermisoOut[]> {
  const params = new URLSearchParams()
  if (opts?.empleadoId) params.set("empleado_id", opts.empleadoId)
  if (opts?.estado) params.set("estado", opts.estado)
  const query = params.toString()
  return authorizedRequest(`/asistencia/permisos${query ? `?${query}` : ""}`)
}

export async function aprobarSolicitudPermiso(solicitudId: string): Promise<SolicitudPermisoOut> {
  return authorizedRequest(`/asistencia/permisos/${solicitudId}/aprobar`, { method: "PATCH" })
}

export async function rechazarSolicitudPermiso(solicitudId: string, motivo: string | null): Promise<SolicitudPermisoOut> {
  return authorizedRequest(`/asistencia/permisos/${solicitudId}/rechazar`, {
    method: "PATCH",
    body: JSON.stringify({ motivo }),
  })
}

export async function obtenerSaldoVacaciones(empleadoId: string, anio?: number): Promise<SaldoVacacionesOut> {
  const query = anio ? `?anio=${anio}` : ""
  return authorizedRequest(`/asistencia/vacaciones/${empleadoId}/saldo${query}`)
}

export async function ajustarSaldoVacaciones(
  empleadoId: string,
  diasDisponibles: number,
  anio?: number
): Promise<SaldoVacacionesOut> {
  return authorizedRequest(`/asistencia/vacaciones/${empleadoId}/saldo`, {
    method: "PATCH",
    body: JSON.stringify({ dias_disponibles: diasDisponibles, anio }),
  })
}

// --- Nomina (Payroll) ---

export async function listarPeriodosNomina(): Promise<PeriodoNominaOut[]> {
  return authorizedRequest("/nomina/periodos")
}

export async function crearPeriodoNomina(data: PeriodoNominaCreate): Promise<PeriodoNominaOut> {
  return authorizedRequest("/nomina/periodos", { method: "POST", body: JSON.stringify(data) })
}

export async function procesarPeriodoNomina(periodoId: string): Promise<ProcesarPeriodoResultadoOut> {
  return authorizedRequest(`/nomina/periodos/${periodoId}/procesar`, { method: "POST" })
}

export async function cerrarPeriodoNomina(periodoId: string): Promise<PeriodoNominaOut> {
  return authorizedRequest(`/nomina/periodos/${periodoId}/cerrar`, { method: "POST" })
}

export async function listarNominasDeEmpleado(empleadoId: string): Promise<NominaOut[]> {
  return authorizedRequest(`/nomina/empleados/${empleadoId}/nominas`)
}

export async function obtenerNomina(nominaId: string): Promise<NominaDetalleOut> {
  return authorizedRequest(`/nomina/nominas/${nominaId}`)
}

export async function descargarVolante(nominaId: string): Promise<void> {
  return descargarBlob(`/nomina/nominas/${nominaId}/volante`, `volante_${nominaId}.pdf`)
}

// --- Capacitacion (LMS) ---

export async function listarCursos(): Promise<CursoOut[]> {
  return authorizedRequest("/capacitacion/cursos")
}

export async function crearCurso(data: CursoCreate): Promise<CursoOut> {
  return authorizedRequest("/capacitacion/cursos", { method: "POST", body: JSON.stringify(data) })
}

export async function inscribirEmpleadoACurso(cursoId: string, empleadoId: string): Promise<InscripcionOut> {
  return authorizedRequest(`/capacitacion/cursos/${cursoId}/inscribir`, {
    method: "POST",
    body: JSON.stringify({ empleado_id: empleadoId }),
  })
}

export async function listarInscripcionesDeCurso(cursoId: string): Promise<InscripcionOut[]> {
  return authorizedRequest(`/capacitacion/cursos/${cursoId}/inscripciones`)
}

export async function actualizarProgresoInscripcion(inscripcionId: string, progreso: number): Promise<InscripcionOut> {
  return authorizedRequest(`/capacitacion/inscripciones/${inscripcionId}/progreso`, {
    method: "PATCH",
    body: JSON.stringify({ progreso }),
  })
}

export async function descargarCertificado(inscripcionId: string): Promise<void> {
  return descargarBlob(`/capacitacion/inscripciones/${inscripcionId}/certificado/descargar`, `certificado_${inscripcionId}.pdf`)
}

export async function listarCertificadosDeEmpleado(empleadoId: string): Promise<InscripcionOut[]> {
  return authorizedRequest(`/capacitacion/empleados/${empleadoId}/certificados`)
}

// --- Autoservicio (ESS) ---

export async function miPerfil(): Promise<EmpleadoOut> {
  return authorizedRequest("/autoservicio/mi-perfil")
}

export async function misVolantesPago(): Promise<NominaOut[]> {
  return authorizedRequest("/autoservicio/mis-volantes-pago")
}

export async function descargarMiVolante(nominaId: string): Promise<void> {
  return descargarBlob(`/autoservicio/mis-volantes-pago/${nominaId}/descargar`, `volante_${nominaId}.pdf`)
}

export async function solicitarMiPermiso(data: {
  tipo: string
  fecha_inicio: string
  fecha_fin: string
  motivo?: string | null
}): Promise<SolicitudPermisoOut> {
  return authorizedRequest("/autoservicio/mis-permisos", { method: "POST", body: JSON.stringify(data) })
}

export async function misPermisos(): Promise<SolicitudPermisoOut[]> {
  return authorizedRequest("/autoservicio/mis-permisos")
}

export async function miSaldoVacaciones(): Promise<SaldoVacacionesOut> {
  return authorizedRequest("/autoservicio/mi-saldo-vacaciones")
}

export async function misCursos(): Promise<InscripcionOut[]> {
  return authorizedRequest("/autoservicio/mis-cursos")
}

export async function misEvaluaciones(): Promise<EvaluacionOut[]> {
  return authorizedRequest("/autoservicio/mis-evaluaciones")
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
