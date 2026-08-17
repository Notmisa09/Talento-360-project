export type RolEnum = "ADMIN_RRHH" | "SUPERVISOR" | "EMPLEADO"

export interface UsuarioOut {
  id: string
  email: string
  rol: RolEnum
  activo: boolean
  fecha_creacion: string
}

export interface Token {
  access_token: string
  refresh_token: string
  token_type: string
}
