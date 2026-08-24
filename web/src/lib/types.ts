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

export interface ExpedienteOut {
  empleado: EmpleadoOut
  contratos: ContratoOut[]
  documentos: DocumentoExpedienteOut[]
  datos_legales: DatosLegalesOut | null
  antiguedad_anios: number
}
