import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom"
import { Toaster } from "@/components/ui/sonner"
import { AuthProvider } from "@/context/auth-context"
import { ProtectedRoute } from "@/components/protected-route"
import { LoginPage } from "@/pages/login-page"
import { ForgotPasswordPage } from "@/pages/forgot-password-page"
import { ResetPasswordPage } from "@/pages/reset-password-page"
import { DashboardPage } from "@/pages/dashboard-page"
import { UsuariosPage } from "@/pages/usuarios-page"
import { EmpleadosPage } from "@/pages/empleados-page"
import { ReclutamientoPage } from "@/pages/reclutamiento-page"
import { DesempenoPage } from "@/pages/desempeno-page"
import { AsistenciaPage } from "@/pages/asistencia-page"
import { NominaPage } from "@/pages/nomina-page"
import { CapacitacionPage } from "@/pages/capacitacion-page"
import { AutoservicioPage } from "@/pages/autoservicio-page"

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
            <Route path="/autoservicio" element={<AutoservicioPage />} />
          </Route>
          <Route element={<ProtectedRoute allowedRoles={["ADMIN_RRHH"]} />}>
            <Route path="/usuarios" element={<UsuariosPage />} />
          </Route>
          <Route element={<ProtectedRoute allowedRoles={["ADMIN_RRHH", "SUPERVISOR"]} />}>
            <Route path="/empleados" element={<EmpleadosPage />} />
            <Route path="/reclutamiento" element={<ReclutamientoPage />} />
            <Route path="/desempeno" element={<DesempenoPage />} />
            <Route path="/asistencia" element={<AsistenciaPage />} />
            <Route path="/nomina" element={<NominaPage />} />
            <Route path="/capacitacion" element={<CapacitacionPage />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
      <Toaster />
    </BrowserRouter>
  )
}

export default App
