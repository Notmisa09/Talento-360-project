import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react"
import { Download, MoreHorizontal, Plus } from "lucide-react"
import { toast } from "sonner"
import { AppLayout } from "@/components/app-layout"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Separator } from "@/components/ui/separator"
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
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  ApiError,
  cambiarEstadoEmpleado,
  cargarDocumento,
  crearContrato,
  crearDepartamento,
  crearEmpleado,
  crearPuesto,
  crearSucursal,
  descargarDocumento,
  listarDepartamentos,
  listarEmpleados,
  listarPuestos,
  listarSucursales,
  obtenerExpediente,
} from "@/lib/api"
import type {
  DepartamentoOut,
  EmpleadoOut,
  EstadoEmpleadoEnum,
  ExpedienteOut,
  PuestoOut,
  SucursalOut,
  TipoContratoEnum,
  TipoDocumentoEnum,
} from "@/lib/types"

const PAGE_SIZE = 10

const ESTADOS: { value: EstadoEmpleadoEnum; label: string }[] = [
  { value: "ACTIVO", label: "Activo" },
  { value: "INACTIVO", label: "Inactivo" },
]

const TIPOS_CONTRATO: { value: TipoContratoEnum; label: string }[] = [
  { value: "INDEFINIDO", label: "Indefinido" },
  { value: "TEMPORAL", label: "Temporal" },
  { value: "POR_HORAS", label: "Por horas" },
  { value: "PRACTICA", label: "Practica" },
]

const TIPOS_DOCUMENTO: { value: TipoDocumentoEnum; label: string }[] = [
  { value: "CEDULA", label: "Cedula/DNI" },
  { value: "CV", label: "Curriculum" },
  { value: "CONTRATO", label: "Contrato" },
  { value: "CERTIFICADO", label: "Certificado" },
  { value: "TITULO", label: "Titulo academico" },
  { value: "OTRO", label: "Otro" },
]

export function EmpleadosPage() {
  const [empleados, setEmpleados] = useState<EmpleadoOut[]>([])
  const [page, setPage] = useState(1)
  const [pages, setPages] = useState(0)
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [filtroEstado, setFiltroEstado] = useState<string>("")
  const [filtroDepartamento, setFiltroDepartamento] = useState<string>("")
  const [busqueda, setBusqueda] = useState("")

  const [sucursales, setSucursales] = useState<SucursalOut[]>([])
  const [departamentos, setDepartamentos] = useState<DepartamentoOut[]>([])
  const [puestos, setPuestos] = useState<PuestoOut[]>([])

  const [busyId, setBusyId] = useState<string | null>(null)
  const [createOpen, setCreateOpen] = useState(false)
  const [expedienteId, setExpedienteId] = useState<string | null>(null)

  const sucursalesMap = useMemo(() => new Map(sucursales.map((s) => [s.id, s.nombre])), [sucursales])
  const departamentosMap = useMemo(() => new Map(departamentos.map((d) => [d.id, d.nombre])), [departamentos])
  const puestosMap = useMemo(() => new Map(puestos.map((p) => [p.id, p.titulo])), [puestos])

  const cargarCatalogos = useCallback(async () => {
    try {
      const [suc, dep, pue] = await Promise.all([listarSucursales(), listarDepartamentos(), listarPuestos()])
      setSucursales(suc)
      setDepartamentos(dep)
      setPuestos(pue)
    } catch {
      toast.error("No se pudieron cargar los catalogos de sucursales/departamentos/puestos")
    }
  }, [])

  const cargarEmpleados = useCallback(
    async (targetPage: number) => {
      setLoading(true)
      setError(null)
      try {
        const data = await listarEmpleados(targetPage, PAGE_SIZE, {
          estado: filtroEstado || undefined,
          departamentoId: filtroDepartamento || undefined,
          q: busqueda || undefined,
        })
        setEmpleados(data.items)
        setTotal(data.total)
        setPages(data.pages)
      } catch (err) {
        setError(err instanceof ApiError ? err.message : "No se pudo cargar la lista de empleados")
      } finally {
        setLoading(false)
      }
    },
    [filtroEstado, filtroDepartamento, busqueda]
  )

  useEffect(() => {
    cargarCatalogos()
  }, [cargarCatalogos])

  useEffect(() => {
    cargarEmpleados(page)
  }, [cargarEmpleados, page])

  async function handleCambiarEstado(empleado: EmpleadoOut, estado: EstadoEmpleadoEnum) {
    if (estado === empleado.estado) return
    setBusyId(empleado.id)
    try {
      const actualizado = await cambiarEstadoEmpleado(empleado.id, estado)
      setEmpleados((prev) => prev.map((e) => (e.id === empleado.id ? actualizado : e)))
      toast.success(`${empleado.nombres} ${empleado.apellidos} ahora esta ${estado === "ACTIVO" ? "activo" : "inactivo"}`)
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "No se pudo cambiar el estado")
    } finally {
      setBusyId(null)
    }
  }

  return (
    <AppLayout title="Empleados">
      <div className="flex items-center justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-semibold tracking-tight">Expediente Digital</h1>
          <p className="text-sm text-muted-foreground">
            Gestiona el personal de la empresa{total > 0 ? ` (${total} en total)` : ""}
          </p>
        </div>
        <CrearEmpleadoDialog
          open={createOpen}
          onOpenChange={setCreateOpen}
          sucursales={sucursales}
          departamentos={departamentos}
          puestos={puestos}
          onSucursalCreada={(s) => setSucursales((prev) => [...prev, s])}
          onDepartamentoCreado={(d) => setDepartamentos((prev) => [...prev, d])}
          onPuestoCreado={(p) => setPuestos((prev) => [...prev, p])}
          onCreated={(nuevo) => {
            toast.success(`Empleado ${nuevo.nombres} ${nuevo.apellidos} registrado (${nuevo.codigo_empleado})`)
            setCreateOpen(false)
            if (page === 1) {
              cargarEmpleados(1)
            } else {
              setPage(1)
            }
          }}
        />
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <Select value={filtroEstado || "TODOS"} onValueChange={(v) => setFiltroEstado(v === "TODOS" || !v ? "" : v)}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Estado" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="TODOS">Todos los estados</SelectItem>
            {ESTADOS.map((e) => (
              <SelectItem key={e.value} value={e.value}>
                {e.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={filtroDepartamento || "TODOS"}
          onValueChange={(v) => setFiltroDepartamento(v === "TODOS" || !v ? "" : v)}
        >
          <SelectTrigger className="w-56">
            <SelectValue placeholder="Departamento" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="TODOS">Todos los departamentos</SelectItem>
            {departamentos.map((d) => (
              <SelectItem key={d.id} value={d.id}>
                {d.nombre}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Input
          placeholder="Buscar por nombre..."
          className="w-64"
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
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
              <TableHead>Codigo</TableHead>
              <TableHead>Nombre</TableHead>
              <TableHead>Departamento</TableHead>
              <TableHead>Puesto</TableHead>
              <TableHead>Sucursal</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead className="w-10" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                  Cargando empleados...
                </TableCell>
              </TableRow>
            ) : empleados.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                  No hay empleados registrados
                </TableCell>
              </TableRow>
            ) : (
              empleados.map((empleado) => {
                const ocupado = busyId === empleado.id
                return (
                  <TableRow key={empleado.id}>
                    <TableCell className="font-mono text-xs">{empleado.codigo_empleado}</TableCell>
                    <TableCell className="font-medium">
                      {empleado.nombres} {empleado.apellidos}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {departamentosMap.get(empleado.departamento_id) ?? "-"}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {puestosMap.get(empleado.puesto_id) ?? "-"}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {sucursalesMap.get(empleado.sucursal_id) ?? "-"}
                    </TableCell>
                    <TableCell>
                      <Badge variant={empleado.estado === "ACTIVO" ? "outline" : "destructive"} className="font-normal">
                        {empleado.estado === "ACTIVO" ? "Activo" : "Inactivo"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger
                          render={<Button variant="ghost" size="icon-sm" disabled={ocupado} />}
                        >
                          <MoreHorizontal />
                          <span className="sr-only">Acciones</span>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => setExpedienteId(empleado.id)}>
                            Ver expediente
                          </DropdownMenuItem>
                          {empleado.estado === "ACTIVO" ? (
                            <DropdownMenuItem
                              variant="destructive"
                              onClick={() => handleCambiarEstado(empleado, "INACTIVO")}
                            >
                              Marcar inactivo
                            </DropdownMenuItem>
                          ) : (
                            <DropdownMenuItem onClick={() => handleCambiarEstado(empleado, "ACTIVO")}>
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

      <ExpedienteSheet
        empleadoId={expedienteId}
        onOpenChange={(open) => {
          if (!open) setExpedienteId(null)
        }}
        departamentosMap={departamentosMap}
        puestosMap={puestosMap}
        sucursalesMap={sucursalesMap}
      />
    </AppLayout>
  )
}

function QuickAddSucursal({ onCreated }: { onCreated: (s: SucursalOut) => void }) {
  const [open, setOpen] = useState(false)
  const [nombre, setNombre] = useState("")
  const [ciudad, setCiudad] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (!open) {
    return (
      <button type="button" className="text-xs text-primary hover:underline" onClick={() => setOpen(true)}>
        + Nueva sucursal
      </button>
    )
  }

  async function handleCrear() {
    if (!nombre.trim()) return
    setSubmitting(true)
    setError(null)
    try {
      const nueva = await crearSucursal({ nombre, ciudad: ciudad || null })
      onCreated(nueva)
      setOpen(false)
      setNombre("")
      setCiudad("")
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "No se pudo crear la sucursal")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="flex flex-col gap-2 rounded-md border border-border/60 p-2">
      <Input placeholder="Nombre de la sucursal" value={nombre} onChange={(e) => setNombre(e.target.value)} />
      <Input placeholder="Ciudad (opcional)" value={ciudad} onChange={(e) => setCiudad(e.target.value)} />
      {error && <p className="text-xs text-destructive">{error}</p>}
      <div className="flex gap-2">
        <Button type="button" size="sm" disabled={submitting} onClick={handleCrear}>
          {submitting ? "Guardando..." : "Guardar"}
        </Button>
        <Button type="button" size="sm" variant="ghost" onClick={() => setOpen(false)}>
          Cancelar
        </Button>
      </div>
    </div>
  )
}

function QuickAddDepartamento({ onCreated }: { onCreated: (d: DepartamentoOut) => void }) {
  const [open, setOpen] = useState(false)
  const [nombre, setNombre] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (!open) {
    return (
      <button type="button" className="text-xs text-primary hover:underline" onClick={() => setOpen(true)}>
        + Nuevo departamento
      </button>
    )
  }

  async function handleCrear() {
    if (!nombre.trim()) return
    setSubmitting(true)
    setError(null)
    try {
      const nuevo = await crearDepartamento({ nombre })
      onCreated(nuevo)
      setOpen(false)
      setNombre("")
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "No se pudo crear el departamento")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="flex flex-col gap-2 rounded-md border border-border/60 p-2">
      <Input placeholder="Nombre del departamento" value={nombre} onChange={(e) => setNombre(e.target.value)} />
      {error && <p className="text-xs text-destructive">{error}</p>}
      <div className="flex gap-2">
        <Button type="button" size="sm" disabled={submitting} onClick={handleCrear}>
          {submitting ? "Guardando..." : "Guardar"}
        </Button>
        <Button type="button" size="sm" variant="ghost" onClick={() => setOpen(false)}>
          Cancelar
        </Button>
      </div>
    </div>
  )
}

function QuickAddPuesto({
  departamentoId,
  onCreated,
}: {
  departamentoId: string
  onCreated: (p: PuestoOut) => void
}) {
  const [open, setOpen] = useState(false)
  const [titulo, setTitulo] = useState("")
  const [salario, setSalario] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (!open) {
    return (
      <button
        type="button"
        className="text-xs text-primary hover:underline disabled:text-muted-foreground"
        disabled={!departamentoId}
        onClick={() => setOpen(true)}
      >
        + Nuevo puesto
      </button>
    )
  }

  async function handleCrear() {
    if (!titulo.trim() || !salario) return
    setSubmitting(true)
    setError(null)
    try {
      const nuevo = await crearPuesto({ titulo, salario_base: Number(salario), departamento_id: departamentoId })
      onCreated(nuevo)
      setOpen(false)
      setTitulo("")
      setSalario("")
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "No se pudo crear el puesto")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="flex flex-col gap-2 rounded-md border border-border/60 p-2">
      <Input placeholder="Titulo del puesto" value={titulo} onChange={(e) => setTitulo(e.target.value)} />
      <Input
        type="number"
        min="0"
        step="0.01"
        placeholder="Salario base"
        value={salario}
        onChange={(e) => setSalario(e.target.value)}
      />
      {error && <p className="text-xs text-destructive">{error}</p>}
      <div className="flex gap-2">
        <Button type="button" size="sm" disabled={submitting} onClick={handleCrear}>
          {submitting ? "Guardando..." : "Guardar"}
        </Button>
        <Button type="button" size="sm" variant="ghost" onClick={() => setOpen(false)}>
          Cancelar
        </Button>
      </div>
    </div>
  )
}

function CrearEmpleadoDialog({
  open,
  onOpenChange,
  sucursales,
  departamentos,
  puestos,
  onSucursalCreada,
  onDepartamentoCreado,
  onPuestoCreado,
  onCreated,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  sucursales: SucursalOut[]
  departamentos: DepartamentoOut[]
  puestos: PuestoOut[]
  onSucursalCreada: (s: SucursalOut) => void
  onDepartamentoCreado: (d: DepartamentoOut) => void
  onPuestoCreado: (p: PuestoOut) => void
  onCreated: (empleado: EmpleadoOut) => void
}) {
  const [nombres, setNombres] = useState("")
  const [apellidos, setApellidos] = useState("")
  const [cedula, setCedula] = useState("")
  const [fechaNacimiento, setFechaNacimiento] = useState("")
  const [fechaIngreso, setFechaIngreso] = useState("")
  const [telefono, setTelefono] = useState("")
  const [direccion, setDireccion] = useState("")
  const [sucursalId, setSucursalId] = useState("")
  const [departamentoId, setDepartamentoId] = useState("")
  const [puestoId, setPuestoId] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const puestosDelDepartamento = departamentoId
    ? puestos.filter((p) => p.departamento_id === departamentoId)
    : []

  function resetForm() {
    setNombres("")
    setApellidos("")
    setCedula("")
    setFechaNacimiento("")
    setFechaIngreso("")
    setTelefono("")
    setDireccion("")
    setSucursalId("")
    setDepartamentoId("")
    setPuestoId("")
    setError(null)
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setError(null)
    setSubmitting(true)
    try {
      const nuevo = await crearEmpleado({
        nombres,
        apellidos,
        cedula_o_dni: cedula,
        fecha_nacimiento: fechaNacimiento,
        fecha_ingreso: fechaIngreso,
        telefono: telefono || null,
        direccion: direccion || null,
        sucursal_id: sucursalId,
        departamento_id: departamentoId,
        puesto_id: puestoId,
      })
      resetForm()
      onCreated(nuevo)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "No se pudo registrar el empleado")
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
        Nuevo empleado
      </DialogTrigger>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Registrar empleado</DialogTitle>
          <DialogDescription>Crea el expediente digital de un nuevo colaborador.</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {error && (
            <Alert variant="destructive">
              <AlertTitle>No se pudo registrar</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-2">
              <Label htmlFor="emp-nombres">Nombres</Label>
              <Input id="emp-nombres" value={nombres} onChange={(e) => setNombres(e.target.value)} required />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="emp-apellidos">Apellidos</Label>
              <Input id="emp-apellidos" value={apellidos} onChange={(e) => setApellidos(e.target.value)} required />
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="emp-cedula">Cedula / DNI</Label>
            <Input id="emp-cedula" value={cedula} onChange={(e) => setCedula(e.target.value)} required />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-2">
              <Label htmlFor="emp-nacimiento">Fecha de nacimiento</Label>
              <Input
                id="emp-nacimiento"
                type="date"
                value={fechaNacimiento}
                onChange={(e) => setFechaNacimiento(e.target.value)}
                required
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="emp-ingreso">Fecha de ingreso</Label>
              <Input
                id="emp-ingreso"
                type="date"
                value={fechaIngreso}
                onChange={(e) => setFechaIngreso(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-2">
              <Label htmlFor="emp-telefono">Telefono</Label>
              <Input id="emp-telefono" value={telefono} onChange={(e) => setTelefono(e.target.value)} />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="emp-direccion">Direccion</Label>
              <Input id="emp-direccion" value={direccion} onChange={(e) => setDireccion(e.target.value)} />
            </div>
          </div>

          <Separator />

          <div className="flex flex-col gap-2">
            <Label>Sucursal</Label>
            <Select value={sucursalId} onValueChange={(v) => setSucursalId(v ?? "")}>
              <SelectTrigger className="w-full">
                <SelectValue>
                  {(v: string | null) =>
                    v ? (sucursales.find((s) => s.id === v)?.nombre ?? v) : "Selecciona una sucursal"
                  }
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {sucursales.map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.nombre}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <QuickAddSucursal
              onCreated={(s) => {
                onSucursalCreada(s)
                setSucursalId(s.id)
              }}
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label>Departamento</Label>
            <Select
              value={departamentoId}
              onValueChange={(value) => {
                setDepartamentoId(value ?? "")
                setPuestoId("")
              }}
            >
              <SelectTrigger className="w-full">
                <SelectValue>
                  {(v: string | null) =>
                    v ? (departamentos.find((d) => d.id === v)?.nombre ?? v) : "Selecciona un departamento"
                  }
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {departamentos.map((d) => (
                  <SelectItem key={d.id} value={d.id}>
                    {d.nombre}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <QuickAddDepartamento
              onCreated={(d) => {
                onDepartamentoCreado(d)
                setDepartamentoId(d.id)
                setPuestoId("")
              }}
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label>Puesto</Label>
            <Select value={puestoId} onValueChange={(v) => setPuestoId(v ?? "")}>
              <SelectTrigger className="w-full" disabled={!departamentoId}>
                <SelectValue>
                  {(v: string | null) =>
                    v
                      ? (puestosDelDepartamento.find((p) => p.id === v)?.titulo ?? v)
                      : departamentoId
                        ? "Selecciona un puesto"
                        : "Elige un departamento primero"
                  }
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {puestosDelDepartamento.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.titulo}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <QuickAddPuesto
              departamentoId={departamentoId}
              onCreated={(p) => {
                onPuestoCreado(p)
                setPuestoId(p.id)
              }}
            />
          </div>

          <DialogFooter>
            <Button type="submit" disabled={submitting || !sucursalId || !departamentoId || !puestoId}>
              {submitting ? "Registrando..." : "Registrar empleado"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function ExpedienteSheet({
  empleadoId,
  onOpenChange,
  departamentosMap,
  puestosMap,
  sucursalesMap,
}: {
  empleadoId: string | null
  onOpenChange: (open: boolean) => void
  departamentosMap: Map<string, string>
  puestosMap: Map<string, string>
  sucursalesMap: Map<string, string>
}) {
  const [expediente, setExpediente] = useState<ExpedienteOut | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const cargar = useCallback(async (id: string) => {
    setLoading(true)
    setError(null)
    try {
      const data = await obtenerExpediente(id)
      setExpediente(data)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "No se pudo cargar el expediente")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (empleadoId) {
      cargar(empleadoId)
    } else {
      setExpediente(null)
    }
  }, [empleadoId, cargar])

  return (
    <Sheet open={empleadoId !== null} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-lg">
        <SheetHeader>
          <SheetTitle>Expediente del empleado</SheetTitle>
          <SheetDescription>
            {expediente
              ? `${expediente.empleado.nombres} ${expediente.empleado.apellidos} - ${expediente.empleado.codigo_empleado}`
              : "Cargando..."}
          </SheetDescription>
        </SheetHeader>

        <div className="flex flex-col gap-6 px-4 pb-4">
          {loading && <p className="text-sm text-muted-foreground">Cargando expediente...</p>}
          {error && (
            <Alert variant="destructive">
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {expediente && (
            <>
              <section className="flex flex-col gap-1 text-sm">
                <p>
                  <span className="text-muted-foreground">Cedula/DNI:</span> {expediente.empleado.cedula_o_dni}
                </p>
                <p>
                  <span className="text-muted-foreground">Departamento:</span>{" "}
                  {departamentosMap.get(expediente.empleado.departamento_id) ?? "-"}
                </p>
                <p>
                  <span className="text-muted-foreground">Puesto:</span>{" "}
                  {puestosMap.get(expediente.empleado.puesto_id) ?? "-"}
                </p>
                <p>
                  <span className="text-muted-foreground">Sucursal:</span>{" "}
                  {sucursalesMap.get(expediente.empleado.sucursal_id) ?? "-"}
                </p>
                <p>
                  <span className="text-muted-foreground">Antiguedad:</span> {expediente.antiguedad_anios} anos
                </p>
              </section>

              <Separator />

              <ContratosSection
                empleadoId={expediente.empleado.id}
                contratos={expediente.contratos}
                onContratoCreado={(c) => setExpediente((prev) => (prev ? { ...prev, contratos: [c, ...prev.contratos] } : prev))}
              />

              <Separator />

              <DocumentosSection
                empleadoId={expediente.empleado.id}
                documentos={expediente.documentos}
                onDocumentoCargado={(d) =>
                  setExpediente((prev) => (prev ? { ...prev, documentos: [d, ...prev.documentos] } : prev))
                }
              />
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}

function ContratosSection({
  empleadoId,
  contratos,
  onContratoCreado,
}: {
  empleadoId: string
  contratos: ExpedienteOut["contratos"]
  onContratoCreado: (c: ExpedienteOut["contratos"][number]) => void
}) {
  const [formOpen, setFormOpen] = useState(false)
  const [tipo, setTipo] = useState<TipoContratoEnum>("INDEFINIDO")
  const [fechaInicio, setFechaInicio] = useState("")
  const [fechaFin, setFechaFin] = useState("")
  const [salario, setSalario] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleCrear() {
    if (!fechaInicio || !salario) return
    setSubmitting(true)
    setError(null)
    try {
      const nuevo = await crearContrato(empleadoId, {
        tipo,
        fecha_inicio: fechaInicio,
        fecha_fin: fechaFin || null,
        salario: Number(salario),
      })
      onContratoCreado(nuevo)
      setFormOpen(false)
      setFechaInicio("")
      setFechaFin("")
      setSalario("")
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "No se pudo registrar el contrato")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <section className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium">Contratos</h3>
        <Button type="button" variant="ghost" size="sm" onClick={() => setFormOpen((v) => !v)}>
          {formOpen ? "Cancelar" : "+ Agregar"}
        </Button>
      </div>

      {formOpen && (
        <div className="flex flex-col gap-2 rounded-md border border-border/60 p-3">
          <Select value={tipo} onValueChange={(v) => setTipo(v as TipoContratoEnum)}>
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {TIPOS_CONTRATO.map((t) => (
                <SelectItem key={t.value} value={t.value}>
                  {t.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="grid grid-cols-2 gap-2">
            <Input type="date" value={fechaInicio} onChange={(e) => setFechaInicio(e.target.value)} />
            <Input type="date" value={fechaFin} onChange={(e) => setFechaFin(e.target.value)} placeholder="Fin (opcional)" />
          </div>
          <Input
            type="number"
            min="0"
            step="0.01"
            placeholder="Salario"
            value={salario}
            onChange={(e) => setSalario(e.target.value)}
          />
          {error && <p className="text-xs text-destructive">{error}</p>}
          <Button type="button" size="sm" disabled={submitting} onClick={handleCrear}>
            {submitting ? "Guardando..." : "Guardar contrato"}
          </Button>
        </div>
      )}

      {contratos.length === 0 ? (
        <p className="text-sm text-muted-foreground">Sin contratos registrados.</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {contratos.map((c) => (
            <li key={c.id} className="rounded-md border border-border/60 p-2 text-sm">
              <div className="flex items-center justify-between">
                <span className="font-medium">{TIPOS_CONTRATO.find((t) => t.value === c.tipo)?.label ?? c.tipo}</span>
                <Badge variant={c.estado === "VIGENTE" ? "outline" : "secondary"} className="font-normal">
                  {c.estado}
                </Badge>
              </div>
              <p className="text-muted-foreground">
                {c.fecha_inicio} {c.fecha_fin ? `- ${c.fecha_fin}` : "- presente"} - RD$ {c.salario.toLocaleString()}
              </p>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}

function DocumentosSection({
  empleadoId,
  documentos,
  onDocumentoCargado,
}: {
  empleadoId: string
  documentos: ExpedienteOut["documentos"]
  onDocumentoCargado: (d: ExpedienteOut["documentos"][number]) => void
}) {
  const [tipo, setTipo] = useState<TipoDocumentoEnum>("OTRO")
  const [archivo, setArchivo] = useState<File | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [descargandoId, setDescargandoId] = useState<string | null>(null)

  async function handleDescargar(documentoId: string, nombreArchivo: string) {
    setDescargandoId(documentoId)
    try {
      await descargarDocumento(empleadoId, documentoId, nombreArchivo)
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "No se pudo descargar el documento")
    } finally {
      setDescargandoId(null)
    }
  }

  async function handleSubir() {
    if (!archivo) return
    setSubmitting(true)
    setError(null)
    try {
      const nuevo = await cargarDocumento(empleadoId, tipo, archivo)
      onDocumentoCargado({
        id: nuevo.id,
        empleado_id: empleadoId,
        tipo,
        nombre_archivo: nuevo.nombre_archivo,
        fecha_carga: new Date().toISOString(),
      })
      setArchivo(null)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "No se pudo cargar el documento")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <section className="flex flex-col gap-3">
      <h3 className="text-sm font-medium">Documentos</h3>

      <div className="flex flex-col gap-2 rounded-md border border-border/60 p-3">
        <Select value={tipo} onValueChange={(v) => setTipo(v as TipoDocumentoEnum)}>
          <SelectTrigger className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {TIPOS_DOCUMENTO.map((t) => (
              <SelectItem key={t.value} value={t.value}>
                {t.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <input
          type="file"
          className="text-sm"
          onChange={(e) => setArchivo(e.target.files?.[0] ?? null)}
        />
        {error && <p className="text-xs text-destructive">{error}</p>}
        <Button type="button" size="sm" disabled={submitting || !archivo} onClick={handleSubir}>
          {submitting ? "Subiendo..." : "Subir documento"}
        </Button>
      </div>

      {documentos.length === 0 ? (
        <p className="text-sm text-muted-foreground">Sin documentos cargados.</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {documentos.map((d) => (
            <li key={d.id} className="flex items-center justify-between rounded-md border border-border/60 p-2 text-sm">
              <div>
                <p className="font-medium">{d.nombre_archivo}</p>
                <p className="text-xs text-muted-foreground">
                  {TIPOS_DOCUMENTO.find((t) => t.value === d.tipo)?.label ?? d.tipo}
                </p>
              </div>
              <button
                type="button"
                disabled={descargandoId === d.id}
                onClick={() => handleDescargar(d.id, d.nombre_archivo)}
                className="text-muted-foreground hover:text-foreground disabled:opacity-50"
              >
                <Download className="size-4" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
