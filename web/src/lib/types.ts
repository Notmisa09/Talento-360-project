export type RolEnum = "ADMIN_RRHH" | "SUPERVISOR" | "EMPLEADO"

export interface UsuarioOut {
  id: string
  email: string
  rol: RolEnum
  activo: boolean
  fecha_creacion: string
}

export interface UsuarioCreate {
  email: string
  password: string
  rol: RolEnum
}

export interface UsuarioUpdate {
  rol?: RolEnum
  activo?: boolean
}

export interface Token {
  access_token: string
  refresh_token: string
  token_type: string
}

export interface PaginatedResponse<T> {
  items: T[]
  total: number
  page: number
  pages: number
}

export type EstadoEmpleadoEnum = "ACTIVO" | "INACTIVO"
export type TipoContratoEnum = "INDEFINIDO" | "TEMPORAL" | "POR_HORAS" | "PRACTICA"
export type EstadoContratoEnum = "VIGENTE" | "FINALIZADO" | "CANCELADO"
export type TipoDocumentoEnum = "CEDULA" | "CV" | "CONTRATO" | "CERTIFICADO" | "TITULO" | "OTRO"

export interface SucursalOut {
  id: string
  nombre: string
  direccion: string | null
  ciudad: string | null
}

export interface SucursalCreate {
  nombre: string
  direccion?: string | null
  ciudad?: string | null
}

export interface DepartamentoOut {
  id: string
  nombre: string
  gerente_id: string | null
}

export interface DepartamentoCreate {
  nombre: string
  gerente_id?: string | null
}

export interface PuestoOut {
  id: string
  titulo: string
  salario_base: number
  descripcion: string | null
  departamento_id: string
}

export interface PuestoCreate {
  titulo: string
  salario_base: number
  descripcion?: string | null
  departamento_id: string
}

export interface EmpleadoOut {
  id: string
  codigo_empleado: string
  nombres: string
  apellidos: string
  cedula_o_dni: string
  fecha_nacimiento: string
  telefono: string | null
  direccion: string | null
  estado: EstadoEmpleadoEnum
  fecha_ingreso: string
  puesto_id: string
  sucursal_id: string
  departamento_id: string
  usuario_id: string | null
  creado_en: string
}

export interface EmpleadoCreate {
  nombres: string
  apellidos: string
  cedula_o_dni: string
  fecha_nacimiento: string
  telefono?: string | null
  direccion?: string | null
  fecha_ingreso: string
  puesto_id: string
  sucursal_id: string
  departamento_id: string
  usuario_id?: string | null
}

export interface EmpleadoUpdate {
  nombres?: string
  apellidos?: string
  telefono?: string | null
  direccion?: string | null
  puesto_id?: string
  sucursal_id?: string
  departamento_id?: string
  usuario_id?: string | null
}

export interface ContratoOut {
  id: string
  empleado_id: string
  tipo: TipoContratoEnum
  fecha_inicio: string
  fecha_fin: string | null
  salario: number
  documento_url: string | null
  estado: EstadoContratoEnum
  creado_en: string
}

export interface ContratoCreate {
  tipo: TipoContratoEnum
  fecha_inicio: string
  fecha_fin?: string | null
  salario: number
  documento_url?: string | null
}

export interface DocumentoExpedienteOut {
  id: string
  empleado_id: string
  tipo: TipoDocumentoEnum
  nombre_archivo: string
  fecha_carga: string
}

export interface DatosLegalesOut {
  id: string
  empleado_id: string
  numero_seguridad_social: string | null
  beneficiarios: string | null
  informacion_emergencia: string | null
}

export interface DatosLegalesUpsert {
  numero_seguridad_social?: string | null
  beneficiarios?: string | null
  informacion_emergencia?: string | null
}

export interface ExpedienteOut {
  empleado: EmpleadoOut
  contratos: ContratoOut[]
  documentos: DocumentoExpedienteOut[]
  datos_legales: DatosLegalesOut | null
  antiguedad_anios: number
}

export type EstadoVacanteEnum = "BORRADOR" | "PUBLICADA" | "CERRADA"
export type EstadoPostulacionEnum =
  | "RECIBIDA"
  | "EN_FILTRO"
  | "ENTREVISTA"
  | "OFERTA"
  | "CONTRATADO"
  | "RECHAZADA"
export type ModalidadEntrevistaEnum = "PRESENCIAL" | "VIRTUAL" | "TELEFONICA"

export interface VacanteOut {
  id: string
  titulo: string
  descripcion: string | null
  departamento_id: string
  sucursal_id: string
  estado: EstadoVacanteEnum
  fecha_publicacion: string | null
  fecha_cierre: string | null
  numero_posiciones: number
  creado_en: string
}

export interface VacanteCreate {
  titulo: string
  descripcion?: string | null
  departamento_id: string
  sucursal_id: string
  numero_posiciones: number
}

export interface CandidatoOut {
  id: string
  nombres: string
  apellidos: string
  email: string
  telefono: string | null
  cv_url: string | null
  linkedin: string | null
}

export interface PostulacionOut {
  id: string
  vacante_id: string
  candidato_id: string
  estado: EstadoPostulacionEnum
  fecha_postulacion: string
  puntaje_filtro: number | null
  motivo_rechazo: string | null
}

export interface EntrevistaOut {
  id: string
  postulacion_id: string
  entrevistador_id: string
  fecha_hora: string
  modalidad: ModalidadEntrevistaEnum
  comentarios: string | null
  calificacion: number | null
}

export interface EntrevistaCreate {
  entrevistador_id: string
  fecha_hora: string
  modalidad: ModalidadEntrevistaEnum
  comentarios?: string | null
}

export interface ContratarPostulacionRequest {
  cedula_o_dni: string
  fecha_nacimiento: string
  fecha_ingreso: string
  puesto_id: string
  tipo_contrato: TipoContratoEnum
  salario: number
}

export interface CicloEvaluacionOut {
  id: string
  nombre: string
  fecha_inicio: string
  fecha_fin: string
}

export interface CicloEvaluacionCreate {
  nombre: string
  fecha_inicio: string
  fecha_fin: string
}

export interface ObjetivoOut {
  id: string
  empleado_id: string
  ciclo_id: string
  descripcion: string
  meta_valor: number
  valor_actual: number
  progreso: number
  creado_en: string
}

export interface ObjetivoCreate {
  empleado_id: string
  ciclo_id: string
  descripcion: string
  meta_valor: number
}

export interface EvaluacionOut {
  id: string
  empleado_id: string
  evaluador_id: string
  ciclo_id: string
  calificacion_final: number
  comentarios: string | null
  plan_mejora: string | null
  creado_en: string
}

export interface EvaluacionCreate {
  empleado_id: string
  evaluador_id: string
  ciclo_id: string
  calificacion_final: number
  comentarios?: string | null
  plan_mejora?: string | null
}

export interface HistorialDesempenoOut {
  objetivos: ObjetivoOut[]
  evaluaciones: EvaluacionOut[]
}

// --- Asistencia y Tiempo ---

export type TipoPermisoEnum = "VACACIONES" | "ENFERMEDAD" | "PERSONAL" | "LUTO" | "MATERNIDAD_PATERNIDAD" | "OTRO"
export type EstadoSolicitudEnum = "PENDIENTE" | "APROBADA" | "RECHAZADA"

export interface RegistroAsistenciaOut {
  id: string
  empleado_id: string
  hora_entrada: string
  hora_salida: string | null
  horas_trabajadas: number | null
  horas_extra: number | null
  origen: string
}

export interface ResumenAsistenciaOut {
  empleado_id: string
  mes: string
  dias_registrados: number
  horas_trabajadas_total: number
  horas_extra_total: number
}

export interface SolicitudPermisoOut {
  id: string
  empleado_id: string
  tipo: TipoPermisoEnum
  fecha_inicio: string
  fecha_fin: string
  motivo: string | null
  estado: EstadoSolicitudEnum
  aprobado_por: string | null
  motivo_rechazo: string | null
  dias_solicitados: number
  creado_en: string
}

export interface SolicitudPermisoCreate {
  empleado_id: string
  tipo: TipoPermisoEnum
  fecha_inicio: string
  fecha_fin: string
  motivo?: string | null
}

export interface SaldoVacacionesOut {
  id: string
  empleado_id: string
  dias_disponibles: number
  dias_tomados: number
  anio: number
}

// --- Nomina (Payroll) ---

export type EstadoPeriodoEnum = "ABIERTO" | "PROCESADO" | "CERRADO"
export type TipoConceptoEnum =
  | "SALARIO_BASE"
  | "HORAS_EXTRA"
  | "BONIFICACION"
  | "DEDUCCION_SFS"
  | "DEDUCCION_AFP"
  | "DEDUCCION_ISR"
  | "OTRO"

export interface PeriodoNominaOut {
  id: string
  fecha_inicio: string
  fecha_fin: string
  estado: EstadoPeriodoEnum
  creado_en: string
}

export interface PeriodoNominaCreate {
  fecha_inicio: string
  fecha_fin: string
}

export interface ConceptoNominaOut {
  id: string
  tipo: TipoConceptoEnum
  descripcion: string
  monto: number
}

export interface NominaOut {
  id: string
  periodo_id: string
  empleado_id: string
  salario_bruto: number
  total_deducciones: number
  total_bonificaciones: number
  salario_neto: number
  creado_en: string
}

export interface NominaDetalleOut extends NominaOut {
  conceptos: ConceptoNominaOut[]
}

export interface ProcesarPeriodoResultadoOut {
  periodo: PeriodoNominaOut
  nominas_generadas: number
}

// --- Capacitacion (LMS) ---

export type EstadoInscripcionEnum = "INSCRITO" | "EN_PROGRESO" | "COMPLETADO" | "ABANDONADO"

export interface CursoOut {
  id: string
  nombre: string
  descripcion: string | null
  obligatorio: boolean
  duracion_horas: number
}

export interface CursoCreate {
  nombre: string
  descripcion?: string | null
  obligatorio?: boolean
  duracion_horas: number
}

export interface InscripcionOut {
  id: string
  curso_id: string
  empleado_id: string
  estado: EstadoInscripcionEnum
  progreso: number
  fecha_finalizacion: string | null
  certificado_url: string | null
  creado_en: string
}
