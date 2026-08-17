import {
  Briefcase,
  CalendarClock,
  ClipboardCheck,
  GraduationCap,
  IdCard,
  UserCircle2,
  Wallet,
} from "lucide-react"
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar"
import { Separator } from "@/components/ui/separator"
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { AppSidebar } from "@/components/app-sidebar"
import { useAuth } from "@/hooks/use-auth"

const modulos = [
  { titulo: "Reclutamiento (ATS)", descripcion: "Vacantes, postulaciones y entrevistas", icon: Briefcase },
  { titulo: "Expediente Digital", descripcion: "Datos personales, contratos y documentos", icon: IdCard },
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
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-14 shrink-0 items-center gap-2 border-b border-border/60 px-4">
          <SidebarTrigger />
          <Separator orientation="vertical" className="h-4" />
          <span className="text-sm font-medium text-muted-foreground">Inicio</span>
        </header>

        <main className="flex flex-1 flex-col gap-8 p-6 md:p-8">
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
              {modulos.map(({ titulo, descripcion, icon: Icon }) => (
                <Card
                  key={titulo}
                  className="border-border/60 shadow-none transition-colors hover:border-primary/30 hover:bg-accent/40"
                >
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex size-9 items-center justify-center rounded-lg bg-accent text-primary">
                        <Icon className="size-4" />
                      </div>
                      <Badge variant="outline" className="font-normal text-muted-foreground">
                        Proximamente
                      </Badge>
                    </div>
                    <CardTitle className="pt-3 text-base font-medium">{titulo}</CardTitle>
                    <CardDescription>{descripcion}</CardDescription>
                  </CardHeader>
                </Card>
              ))}
            </div>
          </div>
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}
