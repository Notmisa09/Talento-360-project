import { Link, useLocation } from "react-router-dom"
import {
  Briefcase,
  Building2,
  CalendarClock,
  ClipboardCheck,
  GraduationCap,
  IdCard,
  LayoutDashboard,
  LogOut,
  UserCircle2,
  Users,
  Wallet,
} from "lucide-react"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { useAuth } from "@/hooks/use-auth"

const modulos = [
  { titulo: "Asistencia y Tiempo", icon: CalendarClock },
  { titulo: "Nomina", icon: Wallet },
  { titulo: "Capacitacion (LMS)", icon: GraduationCap },
  { titulo: "Autoservicio (ESS)", icon: UserCircle2 },
]

function initialsFromEmail(email: string) {
  return email.slice(0, 2).toUpperCase()
}

export function AppSidebar() {
  const { user, logout } = useAuth()
  const location = useLocation()

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <div className="flex items-center gap-2">
          <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Building2 className="size-4" />
          </div>
          <span className="truncate font-semibold group-data-[collapsible=icon]:hidden">
            Talento360-HR
          </span>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  isActive={location.pathname === "/"}
                  tooltip="Inicio"
                  render={<Link to="/" />}
                >
                  <LayoutDashboard />
                  <span>Inicio</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              {(user?.rol === "ADMIN_RRHH" || user?.rol === "SUPERVISOR") && (
                <>
                  <SidebarMenuItem>
                    <SidebarMenuButton
                      isActive={location.pathname === "/empleados"}
                      tooltip="Expediente Digital"
                      render={<Link to="/empleados" />}
                    >
                      <IdCard />
                      <span>Empleados</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton
                      isActive={location.pathname === "/reclutamiento"}
                      tooltip="Reclutamiento (ATS)"
                      render={<Link to="/reclutamiento" />}
                    >
                      <Briefcase />
                      <span>Reclutamiento</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton
                      isActive={location.pathname === "/desempeno"}
                      tooltip="Desempeno y KPIs"
                      render={<Link to="/desempeno" />}
                    >
                      <ClipboardCheck />
                      <span>Desempeno</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                </>
              )}
              {user?.rol === "ADMIN_RRHH" && (
                <SidebarMenuItem>
                  <SidebarMenuButton
                    isActive={location.pathname === "/usuarios"}
                    tooltip="Usuarios"
                    render={<Link to="/usuarios" />}
                  >
                    <Users />
                    <span>Usuarios</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              )}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Modulos HRM</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {modulos.map(({ titulo, icon: Icon }) => (
                <SidebarMenuItem key={titulo}>
                  <SidebarMenuButton disabled className="cursor-not-allowed text-muted-foreground opacity-60">
                    <Icon />
                    <span>{titulo}</span>
                  </SidebarMenuButton>
                  <SidebarMenuBadge className="text-muted-foreground">Pronto</SidebarMenuBadge>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <div className="flex items-center gap-2 px-2 py-1.5 group-data-[collapsible=icon]:hidden">
              <Avatar className="size-8">
                <AvatarFallback className="bg-primary/10 font-medium text-primary">
                  {user ? initialsFromEmail(user.email) : "?"}
                </AvatarFallback>
              </Avatar>
              <div className="flex min-w-0 flex-col">
                <span className="truncate text-sm font-medium">{user?.email}</span>
                <span className="truncate text-xs text-muted-foreground">{user?.rol}</span>
              </div>
            </div>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton onClick={logout} tooltip="Cerrar sesion">
              <LogOut />
              <span>Cerrar sesion</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  )
}
