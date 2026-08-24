import {
  Briefcase,
  CalendarClock,
  ClipboardCheck,
  GraduationCap,
  IdCard,
  UserCircle2,
  Wallet,
} from "lucide-react"
import { Link } from "react-router-dom"
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { AppLayout } from "@/components/app-layout"
import { useAuth } from "@/hooks/use-auth"

const modulos = [
  { titulo: "Reclutamiento (ATS)", descripcion: "Vacantes, postulaciones y entrevistas", icon: Briefcase },
  { titulo: "Expediente Digital", descripcion: "Datos personales, contratos y documentos", icon: IdCard, ruta: "/empleados" },
  { titulo: "Asistencia y Tiempo", descripcion: "Marcaje, permisos y vacaciones", icon: CalendarClock },
  { titulo: "Nomina", descripcion: "Calculo de salarios y volantes de pago", icon: Wallet },
  { titulo: "Desempeno y KPIs", descripcion: "Objetivos y evaluaciones", icon: ClipboardCheck },
  { titulo: "Capacitacion (LMS)", descripcion: "Cursos y certificaciones", icon: GraduationCap },
  { titulo: "Autoservicio (ESS)", descripcion: "Portal del empleado", icon: UserCircle2 },
]

export function DashboardPage() {
  const { user } = useAuth()
  const firstName = user?.email.split("@")[0]

  return (
    <AppLayout title="Inicio">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-tight">
          Bienvenido{firstName ? `, ${firstName}` : ""}
        </h1>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span>Global Retail Solutions, S.A.</span>
          {user && (
            <Badge variant="secondary" className="font-normal">
              {user.rol}
            </Badge>
          )}
        </div>
      </div>

      <div>
        <h2 className="mb-4 text-sm font-medium text-muted-foreground">Modulos del sistema</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {modulos.map(({ titulo, descripcion, icon: Icon, ruta }) => {
            const card = (
              <Card className="h-full border-border/60 shadow-none transition-colors hover:border-primary/30 hover:bg-accent/40">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex size-9 items-center justify-center rounded-lg bg-accent text-primary">
                      <Icon className="size-4" />
                    </div>
                    {!ruta && (
                      <Badge variant="outline" className="font-normal text-muted-foreground">
                        Proximamente
                      </Badge>
                    )}
                  </div>
                  <CardTitle className="pt-3 text-base font-medium">{titulo}</CardTitle>
                  <CardDescription>{descripcion}</CardDescription>
                </CardHeader>
              </Card>
            )
            return ruta ? (
              <Link key={titulo} to={ruta}>
                {card}
              </Link>
            ) : (
              <div key={titulo}>{card}</div>
            )
          })}
        </div>
      </div>
    </AppLayout>
  )
}
