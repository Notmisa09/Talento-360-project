import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom"
import { Toaster } from "@/components/ui/sonner"
import { AuthProvider } from "@/context/auth-context"
import { ProtectedRoute } from "@/components/protected-route"
import { LoginPage } from "@/pages/login-page"
import { ForgotPasswordPage } from "@/pages/forgot-password-page"
import { ResetPasswordPage } from "@/pages/reset-password-page"
import { DashboardPage } from "@/pages/dashboard-page"
import { UsuariosPage } from "@/pages/usuarios-page"

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />
          <Route element={<ProtectedRoute />}>
            <Route path="/" element={<DashboardPage />} />
          </Route>
          <Route element={<ProtectedRoute allowedRoles={["ADMIN_RRHH"]} />}>
            <Route path="/usuarios" element={<UsuariosPage />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
      <Toaster />
    </BrowserRouter>
  )
}

export default App
