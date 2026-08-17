import { Navigate, Outlet } from "react-router-dom"
import { useAuth } from "@/hooks/use-auth"

export function ProtectedRoute() {
  const { status } = useAuth()

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

  return <Outlet />
}
