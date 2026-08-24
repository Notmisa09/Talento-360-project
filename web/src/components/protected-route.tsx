import { Navigate, Outlet } from "react-router-dom"
import { useAuth } from "@/hooks/use-auth"
import type { RolEnum } from "@/lib/types"

export function ProtectedRoute({ allowedRoles }: { allowedRoles?: RolEnum[] }) {
  const { status, user } = useAuth()

  if (status === "loading") {
    return (
      <div className="flex min-h-svh items-center justify-center text-sm text-muted-foreground">
        Cargando...
      </div>
    )
  }

  if (status === "unauthenticated") {
    return <Navigate to="/login" replace />
  }

  if (allowedRoles && user && !allowedRoles.includes(user.rol)) {
    return <Navigate to="/" replace />
  }

  return <Outlet />
}
