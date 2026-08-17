import type { Token, UsuarioOut } from "@/lib/types"

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
