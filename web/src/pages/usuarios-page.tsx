import { useCallback, useEffect, useState, type FormEvent } from "react"
import { MoreHorizontal, Plus } from "lucide-react"
import { toast } from "sonner"
import { AppLayout } from "@/components/app-layout"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { actualizarUsuario, crearUsuario, desactivarUsuario, listarUsuarios } from "@/lib/api"
import { ApiError } from "@/lib/api"
import { useAuth } from "@/hooks/use-auth"
import type { RolEnum, UsuarioOut } from "@/lib/types"

const PAGE_SIZE = 10

const ROLES: { value: RolEnum; label: string }[] = [
  { value: "ADMIN_RRHH", label: "Admin RRHH" },
  { value: "SUPERVISOR", label: "Supervisor" },
  { value: "EMPLEADO", label: "Empleado" },
]

function rolLabel(rol: RolEnum) {
  return ROLES.find((r) => r.value === rol)?.label ?? rol
}

export function UsuariosPage() {
  const { user: currentUser } = useAuth()

  const [usuarios, setUsuarios] = useState<UsuarioOut[]>([])
  const [page, setPage] = useState(1)
  const [pages, setPages] = useState(0)
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [busyId, setBusyId] = useState<string | null>(null)
  const [deactivateTarget, setDeactivateTarget] = useState<UsuarioOut | null>(null)
  const [deactivating, setDeactivating] = useState(false)

  const [createOpen, setCreateOpen] = useState(false)

  const cargarUsuarios = useCallback(async (targetPage: number) => {
    setLoading(true)
    setError(null)
    try {
      const data = await listarUsuarios(targetPage, PAGE_SIZE)
      setUsuarios(data.items)
      setTotal(data.total)
      setPages(data.pages)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "No se pudo cargar la lista de usuarios")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    cargarUsuarios(page)
  }, [cargarUsuarios, page])

  async function handleCambiarRol(usuario: UsuarioOut, rol: RolEnum) {
    if (rol === usuario.rol) return
    setBusyId(usuario.id)
    try {
      const actualizado = await actualizarUsuario(usuario.id, { rol })
      setUsuarios((prev) => prev.map((u) => (u.id === usuario.id ? actualizado : u)))
      toast.success(`Rol de ${usuario.email} actualizado a ${rolLabel(rol)}`)
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "No se pudo actualizar el rol")
    } finally {
      setBusyId(null)
    }
  }

  async function handleReactivar(usuario: UsuarioOut) {
    setBusyId(usuario.id)
    try {
      const actualizado = await actualizarUsuario(usuario.id, { activo: true })
      setUsuarios((prev) => prev.map((u) => (u.id === usuario.id ? actualizado : u)))
      toast.success(`${usuario.email} fue reactivado`)
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "No se pudo reactivar el usuario")
    } finally {
      setBusyId(null)
    }
  }

  async function handleDesactivar() {
    if (!deactivateTarget) return
    setDeactivating(true)
    try {
      await desactivarUsuario(deactivateTarget.id)
      setUsuarios((prev) =>
        prev.map((u) => (u.id === deactivateTarget.id ? { ...u, activo: false } : u))
      )
      toast.success(`${deactivateTarget.email} fue desactivado`)
      setDeactivateTarget(null)
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "No se pudo desactivar el usuario")
    } finally {
      setDeactivating(false)
    }
  }

  return (
    <AppLayout title="Usuarios">
      <div className="flex items-center justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-semibold tracking-tight">Usuarios</h1>
          <p className="text-sm text-muted-foreground">
            Gestiona las cuentas de acceso al sistema{total > 0 ? ` (${total} en total)` : ""}
          </p>
        </div>
        <CrearUsuarioDialog
          open={createOpen}
          onOpenChange={setCreateOpen}
          onCreated={(nuevo) => {
            toast.success(`Usuario ${nuevo.email} registrado`)
            setCreateOpen(false)
            if (page === 1) {
              cargarUsuarios(1)
            } else {
              setPage(1)
            }
          }}
        />
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertTitle>No se pudo cargar la lista</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="rounded-xl border border-border/60">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Email</TableHead>
              <TableHead>Rol</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead>Creado</TableHead>
              <TableHead className="w-10" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                  Cargando usuarios...
                </TableCell>
              </TableRow>
            ) : usuarios.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                  No hay usuarios registrados
                </TableCell>
              </TableRow>
            ) : (
              usuarios.map((usuario) => {
                const esUsuarioActual = usuario.id === currentUser?.id
                const ocupado = busyId === usuario.id

                return (
                  <TableRow key={usuario.id}>
                    <TableCell className="font-medium">
                      {usuario.email}
                      {esUsuarioActual && (
                        <span className="ml-2 text-xs font-normal text-muted-foreground">(tu)</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="font-normal">
                        {rolLabel(usuario.rol)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={usuario.activo ? "outline" : "destructive"}
                        className="font-normal"
                      >
                        {usuario.activo ? "Activo" : "Inactivo"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {new Date(usuario.fecha_creacion).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger
                          render={
                            <Button
                              variant="ghost"
                              size="icon-sm"
                              disabled={ocupado || esUsuarioActual}
                            />
                          }
                        >
                          <MoreHorizontal />
                          <span className="sr-only">Acciones</span>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuRadioGroup
                            value={usuario.rol}
                            onValueChange={(value) => handleCambiarRol(usuario, value as RolEnum)}
                          >
                            <DropdownMenuLabel>Cambiar rol</DropdownMenuLabel>
                            {ROLES.map((r) => (
                              <DropdownMenuRadioItem key={r.value} value={r.value}>
                                {r.label}
                              </DropdownMenuRadioItem>
                            ))}
                          </DropdownMenuRadioGroup>
                          <DropdownMenuSeparator />
                          {usuario.activo ? (
                            <DropdownMenuItem
                              variant="destructive"
                              onClick={() => setDeactivateTarget(usuario)}
                            >
                              Desactivar
                            </DropdownMenuItem>
                          ) : (
                            <DropdownMenuItem onClick={() => handleReactivar(usuario)}>
                              Reactivar
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                )
              })
            )}
          </TableBody>
        </Table>
      </div>

      {pages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Pagina {page} de {pages}
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1 || loading}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              Anterior
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= pages || loading}
              onClick={() => setPage((p) => Math.min(pages, p + 1))}
            >
              Siguiente
            </Button>
          </div>
        </div>
      )}

      <AlertDialog
        open={deactivateTarget !== null}
        onOpenChange={(open) => {
          if (!open) setDeactivateTarget(null)
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Desactivar usuario</AlertDialogTitle>
            <AlertDialogDescription>
              {deactivateTarget?.email} perdera el acceso al sistema. Podras reactivarlo despues si es
              necesario.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deactivating}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              disabled={deactivating}
              onClick={handleDesactivar}
            >
              {deactivating ? "Desactivando..." : "Desactivar"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AppLayout>
  )
}

function CrearUsuarioDialog({
  open,
  onOpenChange,
  onCreated,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  onCreated: (usuario: UsuarioOut) => void
}) {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [rol, setRol] = useState<RolEnum>("EMPLEADO")
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function resetForm() {
    setEmail("")
    setPassword("")
    setRol("EMPLEADO")
    setError(null)
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setError(null)
    setSubmitting(true)
    try {
      const nuevo = await crearUsuario({ email, password, rol })
      resetForm()
      onCreated(nuevo)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "No se pudo registrar el usuario")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) resetForm()
        onOpenChange(next)
      }}
    >
      <DialogTrigger render={<Button />}>
        <Plus />
        Nuevo usuario
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Registrar usuario</DialogTitle>
          <DialogDescription>Crea una nueva cuenta de acceso al sistema.</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {error && (
            <Alert variant="destructive">
              <AlertTitle>No se pudo registrar</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="flex flex-col gap-2">
            <Label htmlFor="nuevo-email">Correo electronico</Label>
            <Input
              id="nuevo-email"
              type="email"
              autoComplete="off"
              placeholder="usuario@talento360.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="nuevo-password">Contrasena</Label>
            <Input
              id="nuevo-password"
              type="password"
              autoComplete="new-password"
              minLength={8}
              maxLength={72}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <p className="text-xs text-muted-foreground">Minimo 8 caracteres.</p>
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="nuevo-rol">Rol</Label>
            <Select value={rol} onValueChange={(value) => setRol(value as RolEnum)}>
              <SelectTrigger id="nuevo-rol" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ROLES.map((r) => (
                  <SelectItem key={r.value} value={r.value}>
                    {r.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <DialogFooter>
            <Button type="submit" disabled={submitting}>
              {submitting ? "Registrando..." : "Registrar usuario"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
