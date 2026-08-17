import { createContext, useCallback, useEffect, useState, type ReactNode } from "react"
import { login as apiLogin, me as apiMe } from "@/lib/api"
import { authStorage } from "@/lib/auth-storage"
import type { UsuarioOut } from "@/lib/types"

type AuthStatus = "loading" | "authenticated" | "unauthenticated"

interface AuthContextValue {
  status: AuthStatus
  user: UsuarioOut | null
  login: (email: string, password: string) => Promise<void>
  logout: () => void
}

// eslint-disable-next-line react-refresh/only-export-components
export const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<AuthStatus>("loading")
  const [user, setUser] = useState<UsuarioOut | null>(null)

  useEffect(() => {
    const token = authStorage.getAccessToken()
    if (!token) {
      setStatus("unauthenticated")
      return
    }
    apiMe(token)
      .then((usuario) => {
        setUser(usuario)
        setStatus("authenticated")
      })
      .catch(() => {
        authStorage.clear()
        setStatus("unauthenticated")
      })
  }, [])

  const login = useCallback(async (email: string, password: string) => {
    const token = await apiLogin(email, password)
    authStorage.setTokens(token.access_token, token.refresh_token)
    const usuario = await apiMe(token.access_token)
    setUser(usuario)
    setStatus("authenticated")
  }, [])

  const logout = useCallback(() => {
    authStorage.clear()
    setUser(null)
    setStatus("unauthenticated")
  }, [])

  return <AuthContext.Provider value={{ status, user, login, logout }}>{children}</AuthContext.Provider>
}
