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
