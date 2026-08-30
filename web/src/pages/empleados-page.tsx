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
  actualizarEmpleado,
  cambiarEstadoEmpleado,
  cargarDocumento,
  crearContrato,
  crearDepartamento,
  crearEmpleado,
  crearPuesto,
  crearSucursal,
  descargarDocumento,
  guardarDatosLegales,
  listarDepartamentos,
  listarEmpleados,
  listarPuestos,
  listarSucursales,
  listarUsuarios,
  obtenerExpediente,
} from "@/lib/api"
import { useAuth } from "@/hooks/use-auth"
import type {
  DatosLegalesOut,
  DepartamentoOut,
  EmpleadoOut,
  EstadoEmpleadoEnum,
  ExpedienteOut,
  PuestoOut,
  SucursalOut,
  TipoContratoEnum,
  TipoDocumentoEnum,
  UsuarioOut,
} from "@/lib/types"
import {
  recolectarErrores,
  validarArchivo,
  validarCedula,
  validarFechaIngreso,
  validarFechaNacimiento,
  validarLongitudMaxima,
  validarMonto,
  validarNombre,
  validarRangoFechas,
  validarRequerido,
  validarSeleccion,
  validarTelefono,
} from "@/lib/validation"

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
  const { user } = useAuth()
  const puedeVincularUsuarios = user?.rol === "ADMIN_RRHH"

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
  const [usuarios, setUsuarios] = useState<UsuarioOut[]>([])

  const [busyId, setBusyId] = useState<string | null>(null)
  const [createOpen, setCreateOpen] = useState(false)
  const [expedienteId, setExpedienteId] = useState<string | null>(null)
  const [editTarget, setEditTarget] = useState<EmpleadoOut | null>(null)

  const sucursalesMap = useMemo(() => new Map(sucursales.map((s) => [s.id, s.nombre])), [sucursales])
  const departamentosMap = useMemo(() => new Map(departamentos.map((d) => [d.id, d.nombre])), [departamentos])
  const puestosMap = useMemo(() => new Map(puestos.map((p) => [p.id, p.titulo])), [puestos])
  const usuariosMap = useMemo(() => new Map(usuarios.map((u) => [u.id, u.email])), [usuarios])

  const cargarCatalogos = useCallback(async () => {
    try {
      const [suc, dep, pue] = await Promise.all([listarSucursales(), listarDepartamentos(), listarPuestos()])
      setSucursales(suc)
      setDepartamentos(dep)
      setPuestos(pue)
    } catch {
      toast.error("No se pudieron cargar los catalogos de sucursales/departamentos/puestos")
    }
    if (puedeVincularUsuarios) {
      try {
        const data = await listarUsuarios(1, 100)
        setUsuarios(data.items)
      } catch {
        toast.error("No se pudo cargar la lista de cuentas de usuario")
      }
    }
  }, [puedeVincularUsuarios])

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
          usuarios={usuarios}
          puedeVincularUsuarios={puedeVincularUsuarios}
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
                          <DropdownMenuItem onClick={() => setEditTarget(empleado)}>Editar</DropdownMenuItem>
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
        usuariosMap={usuariosMap}
      />

      <EditarEmpleadoDialog
        empleado={editTarget}
        onOpenChange={(open) => {
          if (!open) setEditTarget(null)
        }}
        sucursales={sucursales}
        departamentos={departamentos}
        puestos={puestos}
        usuarios={usuarios}
        puedeVincularUsuarios={puedeVincularUsuarios}
        onActualizado={(actualizado) => {
          setEmpleados((prev) => prev.map((e) => (e.id === actualizado.id ? actualizado : e)))
          toast.success(`${actualizado.nombres} ${actualizado.apellidos} actualizado`)
          setEditTarget(null)
        }}
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
    const validacion = validarNombre(nombre, "El nombre de la sucursal")
    if (validacion) {
      setError(validacion)
      return
    }
    setSubmitting(true)
    setError(null)
    try {
      const nueva = await crearSucursal({ nombre: nombre.trim(), ciudad: ciudad.trim() || null })
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
    const validacion = validarNombre(nombre, "El nombre del departamento")
    if (validacion) {
      setError(validacion)
      return
    }
    setSubmitting(true)
    setError(null)
    try {
      const nuevo = await crearDepartamento({ nombre: nombre.trim() })
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
    const errorTitulo = validarNombre(titulo, "El titulo del puesto")
    const errorSalario = validarMonto(salario, "El salario base")
    if (errorTitulo || errorSalario) {
      setError(errorTitulo ?? errorSalario)
      return
    }
    setSubmitting(true)
    setError(null)
    try {
      const nuevo = await crearPuesto({
        titulo: titulo.trim(),
        salario_base: Number(salario),
        departamento_id: departamentoId,
      })
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
  usuarios,
  puedeVincularUsuarios,
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
  usuarios: UsuarioOut[]
  puedeVincularUsuarios: boolean
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
  const [usuarioId, setUsuarioId] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [errores, setErrores] = useState<Record<string, string>>({})

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
    setUsuarioId("")
    setError(null)
    setErrores({})
  }

  function validarTodo(): Record<string, string> {
    return recolectarErrores({
      nombres: validarNombre(nombres, "Los nombres"),
      apellidos: validarNombre(apellidos, "Los apellidos"),
      cedula: validarCedula(cedula),
      fechaNacimiento: validarFechaNacimiento(fechaNacimiento),
      fechaIngreso: validarFechaIngreso(fechaIngreso, fechaNacimiento),
      telefono: validarTelefono(telefono),
      direccion: validarLongitudMaxima(direccion, 255, "La direccion"),
      sucursalId: validarSeleccion(sucursalId, "una sucursal"),
      departamentoId: validarSeleccion(departamentoId, "un departamento"),
      puestoId: validarSeleccion(puestoId, "un puesto"),
    })
  }

  function validarCampo(campo: string, mensaje: string | null) {
    setErrores((prev) => {
      const siguiente = { ...prev }
      if (mensaje) {
        siguiente[campo] = mensaje
      } else {
        delete siguiente[campo]
      }
      return siguiente
    })
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setError(null)
    const nuevosErrores = validarTodo()
    setErrores(nuevosErrores)
    if (Object.keys(nuevosErrores).length > 0) return

    setSubmitting(true)
    try {
      const nuevo = await crearEmpleado({
        nombres: nombres.trim(),
        apellidos: apellidos.trim(),
        cedula_o_dni: cedula.trim(),
        fecha_nacimiento: fechaNacimiento,
        fecha_ingreso: fechaIngreso,
        telefono: telefono.trim() || null,
        direccion: direccion.trim() || null,
        sucursal_id: sucursalId,
        departamento_id: departamentoId,
        puesto_id: puestoId,
        usuario_id: usuarioId || null,
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
              <Input
                id="emp-nombres"
                value={nombres}
                onChange={(e) => setNombres(e.target.value)}
                onBlur={() => validarCampo("nombres", validarNombre(nombres, "Los nombres"))}
                aria-invalid={!!errores.nombres}
              />
              {errores.nombres && <p className="text-xs text-destructive">{errores.nombres}</p>}
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="emp-apellidos">Apellidos</Label>
              <Input
                id="emp-apellidos"
                value={apellidos}
                onChange={(e) => setApellidos(e.target.value)}
                onBlur={() => validarCampo("apellidos", validarNombre(apellidos, "Los apellidos"))}
                aria-invalid={!!errores.apellidos}
              />
              {errores.apellidos && <p className="text-xs text-destructive">{errores.apellidos}</p>}
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="emp-cedula">Cedula / DNI</Label>
            <Input
              id="emp-cedula"
              value={cedula}
              onChange={(e) => setCedula(e.target.value)}
              onBlur={() => validarCampo("cedula", validarCedula(cedula))}
              aria-invalid={!!errores.cedula}
            />
            {errores.cedula && <p className="text-xs text-destructive">{errores.cedula}</p>}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-2">
              <Label htmlFor="emp-nacimiento">Fecha de nacimiento</Label>
              <Input
                id="emp-nacimiento"
                type="date"
                value={fechaNacimiento}
                onChange={(e) => setFechaNacimiento(e.target.value)}
                onBlur={() => validarCampo("fechaNacimiento", validarFechaNacimiento(fechaNacimiento))}
                aria-invalid={!!errores.fechaNacimiento}
              />
              {errores.fechaNacimiento && <p className="text-xs text-destructive">{errores.fechaNacimiento}</p>}
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="emp-ingreso">Fecha de ingreso</Label>
              <Input
                id="emp-ingreso"
                type="date"
                value={fechaIngreso}
                onChange={(e) => setFechaIngreso(e.target.value)}
                onBlur={() => validarCampo("fechaIngreso", validarFechaIngreso(fechaIngreso, fechaNacimiento))}
                aria-invalid={!!errores.fechaIngreso}
              />
              {errores.fechaIngreso && <p className="text-xs text-destructive">{errores.fechaIngreso}</p>}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-2">
              <Label htmlFor="emp-telefono">Telefono</Label>
              <Input
                id="emp-telefono"
                value={telefono}
                onChange={(e) => setTelefono(e.target.value)}
                onBlur={() => validarCampo("telefono", validarTelefono(telefono))}
                aria-invalid={!!errores.telefono}
              />
              {errores.telefono && <p className="text-xs text-destructive">{errores.telefono}</p>}
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="emp-direccion">Direccion</Label>
              <Input
                id="emp-direccion"
                value={direccion}
                onChange={(e) => setDireccion(e.target.value)}
                onBlur={() => validarCampo("direccion", validarLongitudMaxima(direccion, 255, "La direccion"))}
                aria-invalid={!!errores.direccion}
              />
              {errores.direccion && <p className="text-xs text-destructive">{errores.direccion}</p>}
            </div>
          </div>

          <Separator />

          <div className="flex flex-col gap-2">
            <Label>Sucursal</Label>
            <Select
              value={sucursalId}
              onValueChange={(v) => {
                setSucursalId(v ?? "")
                validarCampo("sucursalId", validarSeleccion(v ?? "", "una sucursal"))
              }}
            >
              <SelectTrigger className="w-full" aria-invalid={!!errores.sucursalId}>
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
            {errores.sucursalId && <p className="text-xs text-destructive">{errores.sucursalId}</p>}
            <QuickAddSucursal
              onCreated={(s) => {
                onSucursalCreada(s)
                setSucursalId(s.id)
                validarCampo("sucursalId", null)
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
                validarCampo("departamentoId", validarSeleccion(value ?? "", "un departamento"))
              }}
            >
              <SelectTrigger className="w-full" aria-invalid={!!errores.departamentoId}>
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
            {errores.departamentoId && <p className="text-xs text-destructive">{errores.departamentoId}</p>}
            <QuickAddDepartamento
              onCreated={(d) => {
                onDepartamentoCreado(d)
                setDepartamentoId(d.id)
                setPuestoId("")
                validarCampo("departamentoId", null)
              }}
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label>Puesto</Label>
            <Select
              value={puestoId}
              onValueChange={(v) => {
                setPuestoId(v ?? "")
                validarCampo("puestoId", validarSeleccion(v ?? "", "un puesto"))
              }}
            >
              <SelectTrigger className="w-full" disabled={!departamentoId} aria-invalid={!!errores.puestoId}>
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
            {errores.puestoId && <p className="text-xs text-destructive">{errores.puestoId}</p>}
            <QuickAddPuesto
              departamentoId={departamentoId}
              onCreated={(p) => {
                onPuestoCreado(p)
                setPuestoId(p.id)
                validarCampo("puestoId", null)
              }}
            />
          </div>

          {puedeVincularUsuarios && (() => {
            const opciones = usuarios.filter((u) => u.rol === "EMPLEADO" && u.activo)
            return (
              <div className="flex flex-col gap-2">
                <Label>Cuenta de usuario vinculada (opcional)</Label>
                <Select value={usuarioId || "NINGUNA"} onValueChange={(v) => setUsuarioId(v === "NINGUNA" ? "" : (v ?? ""))}>
                  <SelectTrigger className="w-full">
                    <SelectValue>
                      {(v: string | null) =>
                        !v || v === "NINGUNA"
                          ? "Sin vincular"
                          : (opciones.find((u) => u.id === v)?.email ?? v)
                      }
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="NINGUNA">Sin vincular</SelectItem>
                    {opciones.map((u) => (
                      <SelectItem key={u.id} value={u.id}>
                        {u.email}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Permite que este colaborador use el portal de Autoservicio con esa cuenta. Solo se listan
                  cuentas activas con rol Empleado.
                </p>
              </div>
            )
          })()}

          <DialogFooter>
            <Button type="submit" disabled={submitting}>
              {submitting ? "Registrando..." : "Registrar empleado"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function EditarEmpleadoDialog({
  empleado,
  onOpenChange,
  sucursales,
  departamentos,
  puestos,
  usuarios,
  puedeVincularUsuarios,
  onActualizado,
}: {
  empleado: EmpleadoOut | null
  onOpenChange: (open: boolean) => void
  sucursales: SucursalOut[]
  departamentos: DepartamentoOut[]
  puestos: PuestoOut[]
  usuarios: UsuarioOut[]
  puedeVincularUsuarios: boolean
  onActualizado: (empleado: EmpleadoOut) => void
}) {
  const [nombres, setNombres] = useState("")
  const [apellidos, setApellidos] = useState("")
  const [telefono, setTelefono] = useState("")
  const [direccion, setDireccion] = useState("")
  const [sucursalId, setSucursalId] = useState("")
  const [departamentoId, setDepartamentoId] = useState("")
  const [puestoId, setPuestoId] = useState("")
  const [usuarioId, setUsuarioId] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [errores, setErrores] = useState<Record<string, string>>({})

  useEffect(() => {
    if (empleado) {
      setNombres(empleado.nombres)
      setApellidos(empleado.apellidos)
      setTelefono(empleado.telefono ?? "")
      setDireccion(empleado.direccion ?? "")
      setSucursalId(empleado.sucursal_id)
      setDepartamentoId(empleado.departamento_id)
      setPuestoId(empleado.puesto_id)
      setUsuarioId(empleado.usuario_id ?? "")
      setError(null)
      setErrores({})
    }
  }, [empleado])

  const opcionesUsuario = useMemo(() => {
    const base = usuarios.filter((u) => u.rol === "EMPLEADO" && u.activo)
    if (empleado?.usuario_id && !base.some((u) => u.id === empleado.usuario_id)) {
      const actual = usuarios.find((u) => u.id === empleado.usuario_id)
      if (actual) return [actual, ...base]
    }
    return base
  }, [usuarios, empleado])

  const puestosDelDepartamento = departamentoId
    ? puestos.filter((p) => p.departamento_id === departamentoId)
    : []

  function validarCampo(campo: string, mensaje: string | null) {
    setErrores((prev) => {
      const siguiente = { ...prev }
      if (mensaje) {
        siguiente[campo] = mensaje
      } else {
        delete siguiente[campo]
      }
      return siguiente
    })
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    if (!empleado) return
    setError(null)

    const nuevosErrores = recolectarErrores({
      nombres: validarNombre(nombres, "Los nombres"),
      apellidos: validarNombre(apellidos, "Los apellidos"),
      telefono: validarTelefono(telefono),
      direccion: validarLongitudMaxima(direccion, 255, "La direccion"),
      sucursalId: validarSeleccion(sucursalId, "una sucursal"),
      departamentoId: validarSeleccion(departamentoId, "un departamento"),
      puestoId: validarSeleccion(puestoId, "un puesto"),
    })
    setErrores(nuevosErrores)
    if (Object.keys(nuevosErrores).length > 0) return

    setSubmitting(true)
    try {
      const actualizado = await actualizarEmpleado(empleado.id, {
        nombres: nombres.trim(),
        apellidos: apellidos.trim(),
        telefono: telefono.trim() || null,
        direccion: direccion.trim() || null,
        sucursal_id: sucursalId,
        departamento_id: departamentoId,
        puesto_id: puestoId,
        usuario_id: usuarioId || null,
      })
      onActualizado(actualizado)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "No se pudo actualizar el empleado")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={empleado !== null} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Editar empleado</DialogTitle>
          <DialogDescription>
            {empleado ? `${empleado.codigo_empleado} - ${empleado.cedula_o_dni}` : ""}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {error && (
            <Alert variant="destructive">
              <AlertTitle>No se pudo actualizar</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-2">
              <Label htmlFor="edit-nombres">Nombres</Label>
              <Input
                id="edit-nombres"
                value={nombres}
                onChange={(e) => setNombres(e.target.value)}
                onBlur={() => validarCampo("nombres", validarNombre(nombres, "Los nombres"))}
                aria-invalid={!!errores.nombres}
              />
              {errores.nombres && <p className="text-xs text-destructive">{errores.nombres}</p>}
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="edit-apellidos">Apellidos</Label>
              <Input
                id="edit-apellidos"
                value={apellidos}
                onChange={(e) => setApellidos(e.target.value)}
                onBlur={() => validarCampo("apellidos", validarNombre(apellidos, "Los apellidos"))}
                aria-invalid={!!errores.apellidos}
              />
              {errores.apellidos && <p className="text-xs text-destructive">{errores.apellidos}</p>}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-2">
              <Label htmlFor="edit-telefono">Telefono</Label>
              <Input
                id="edit-telefono"
                value={telefono}
                onChange={(e) => setTelefono(e.target.value)}
                onBlur={() => validarCampo("telefono", validarTelefono(telefono))}
                aria-invalid={!!errores.telefono}
              />
              {errores.telefono && <p className="text-xs text-destructive">{errores.telefono}</p>}
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="edit-direccion">Direccion</Label>
              <Input
                id="edit-direccion"
                value={direccion}
                onChange={(e) => setDireccion(e.target.value)}
                onBlur={() => validarCampo("direccion", validarLongitudMaxima(direccion, 255, "La direccion"))}
                aria-invalid={!!errores.direccion}
              />
              {errores.direccion && <p className="text-xs text-destructive">{errores.direccion}</p>}
            </div>
          </div>

          <Separator />

          <div className="flex flex-col gap-2">
            <Label>Sucursal</Label>
            <Select
              value={sucursalId}
              onValueChange={(v) => {
                setSucursalId(v ?? "")
                validarCampo("sucursalId", validarSeleccion(v ?? "", "una sucursal"))
              }}
            >
              <SelectTrigger className="w-full" aria-invalid={!!errores.sucursalId}>
                <SelectValue>
                  {(v: string | null) => (v ? (sucursales.find((s) => s.id === v)?.nombre ?? v) : "Selecciona una sucursal")}
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
            {errores.sucursalId && <p className="text-xs text-destructive">{errores.sucursalId}</p>}
          </div>

          <div className="flex flex-col gap-2">
            <Label>Departamento</Label>
            <Select
              value={departamentoId}
              onValueChange={(value) => {
                setDepartamentoId(value ?? "")
                if (!puestosDelDepartamento.some((p) => p.departamento_id === value)) setPuestoId("")
                validarCampo("departamentoId", validarSeleccion(value ?? "", "un departamento"))
              }}
            >
              <SelectTrigger className="w-full" aria-invalid={!!errores.departamentoId}>
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
            {errores.departamentoId && <p className="text-xs text-destructive">{errores.departamentoId}</p>}
          </div>

          <div className="flex flex-col gap-2">
            <Label>Puesto</Label>
            <Select
              value={puestoId}
              onValueChange={(v) => {
                setPuestoId(v ?? "")
                validarCampo("puestoId", validarSeleccion(v ?? "", "un puesto"))
              }}
            >
              <SelectTrigger className="w-full" disabled={!departamentoId} aria-invalid={!!errores.puestoId}>
                <SelectValue>
                  {(v: string | null) =>
                    v ? (puestosDelDepartamento.find((p) => p.id === v)?.titulo ?? v) : "Selecciona un puesto"
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
            {errores.puestoId && <p className="text-xs text-destructive">{errores.puestoId}</p>}
          </div>

          {puedeVincularUsuarios && (
            <div className="flex flex-col gap-2">
              <Label>Cuenta de usuario vinculada</Label>
              <Select value={usuarioId || "NINGUNA"} onValueChange={(v) => setUsuarioId(v === "NINGUNA" ? "" : (v ?? ""))}>
                <SelectTrigger className="w-full">
                  <SelectValue>
                    {(v: string | null) =>
                      !v || v === "NINGUNA"
                        ? "Sin vincular"
                        : (opcionesUsuario.find((u) => u.id === v)?.email ?? v)
                    }
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="NINGUNA">Sin vincular</SelectItem>
                  {opcionesUsuario.map((u) => (
                    <SelectItem key={u.id} value={u.id}>
                      {u.email}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Vincula este expediente a una cuenta para que el colaborador pueda usar el portal de
                Autoservicio. Elige "Sin vincular" para desvincular la cuenta actual.
              </p>
            </div>
          )}

          <DialogFooter>
            <Button type="submit" disabled={submitting}>
              {submitting ? "Guardando..." : "Guardar cambios"}
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
  usuariosMap,
}: {
  empleadoId: string | null
  onOpenChange: (open: boolean) => void
  departamentosMap: Map<string, string>
  puestosMap: Map<string, string>
  sucursalesMap: Map<string, string>
  usuariosMap: Map<string, string>
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
                <p>
                  <span className="text-muted-foreground">Cuenta de Autoservicio:</span>{" "}
                  {expediente.empleado.usuario_id ? (
                    (usuariosMap.get(expediente.empleado.usuario_id) ?? "Vinculada")
                  ) : (
                    <span className="text-destructive">Sin vincular</span>
                  )}
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

              <Separator />

              <DatosLegalesSection
                empleadoId={expediente.empleado.id}
                datosLegales={expediente.datos_legales}
                onGuardado={(datos) => setExpediente((prev) => (prev ? { ...prev, datos_legales: datos } : prev))}
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
    const errorInicio = validarRequerido(fechaInicio, "La fecha de inicio")
    const errorRango = validarRangoFechas(fechaInicio, fechaFin)
    const errorSalario = validarMonto(salario, "El salario")
    const primerError = errorInicio ?? errorRango ?? errorSalario
    if (primerError) {
      setError(primerError)
      return
    }
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
    const errorArchivo = validarArchivo(archivo)
    if (errorArchivo) {
      setError(errorArchivo)
      return
    }
    setSubmitting(true)
    setError(null)
    try {
      const nuevo = await cargarDocumento(empleadoId, tipo, archivo as File)
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

function DatosLegalesSection({
  empleadoId,
  datosLegales,
  onGuardado,
}: {
  empleadoId: string
  datosLegales: DatosLegalesOut | null
  onGuardado: (datos: DatosLegalesOut) => void
}) {
  const [editando, setEditando] = useState(false)
  const [numeroSeguridadSocial, setNumeroSeguridadSocial] = useState("")
  const [beneficiarios, setBeneficiarios] = useState("")
  const [informacionEmergencia, setInformacionEmergencia] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [errores, setErrores] = useState<Record<string, string>>({})

  function iniciarEdicion() {
    setNumeroSeguridadSocial(datosLegales?.numero_seguridad_social ?? "")
    setBeneficiarios(datosLegales?.beneficiarios ?? "")
    setInformacionEmergencia(datosLegales?.informacion_emergencia ?? "")
    setError(null)
    setErrores({})
    setEditando(true)
  }

  async function handleGuardar() {
    const nuevosErrores = recolectarErrores({
      numeroSeguridadSocial: validarLongitudMaxima(numeroSeguridadSocial, 50, "El numero de seguridad social"),
      beneficiarios: validarLongitudMaxima(beneficiarios, 2000, "Los beneficiarios"),
      informacionEmergencia: validarLongitudMaxima(informacionEmergencia, 2000, "La informacion de emergencia"),
    })
    setErrores(nuevosErrores)
    if (Object.keys(nuevosErrores).length > 0) return

    setSubmitting(true)
    setError(null)
    try {
      const datos = await guardarDatosLegales(empleadoId, {
        numero_seguridad_social: numeroSeguridadSocial.trim() || null,
        beneficiarios: beneficiarios.trim() || null,
        informacion_emergencia: informacionEmergencia.trim() || null,
      })
      onGuardado(datos)
      setEditando(false)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "No se pudieron guardar los datos legales")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <section className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium">Datos legales</h3>
        {!editando && (
          <Button type="button" variant="ghost" size="sm" onClick={iniciarEdicion}>
            {datosLegales ? "Editar" : "+ Agregar"}
          </Button>
        )}
      </div>

      {editando ? (
        <div className="flex flex-col gap-2 rounded-md border border-border/60 p-3">
          {error && <p className="text-xs text-destructive">{error}</p>}
          <div className="flex flex-col gap-1">
            <Label className="text-xs">Numero de seguridad social</Label>
            <Input
              value={numeroSeguridadSocial}
              onChange={(e) => setNumeroSeguridadSocial(e.target.value)}
              aria-invalid={!!errores.numeroSeguridadSocial}
            />
            {errores.numeroSeguridadSocial && (
              <p className="text-xs text-destructive">{errores.numeroSeguridadSocial}</p>
            )}
          </div>
          <div className="flex flex-col gap-1">
            <Label className="text-xs">Beneficiarios</Label>
            <Input
              value={beneficiarios}
              onChange={(e) => setBeneficiarios(e.target.value)}
              aria-invalid={!!errores.beneficiarios}
            />
            {errores.beneficiarios && <p className="text-xs text-destructive">{errores.beneficiarios}</p>}
          </div>
          <div className="flex flex-col gap-1">
            <Label className="text-xs">Informacion de emergencia</Label>
            <Input
              value={informacionEmergencia}
              onChange={(e) => setInformacionEmergencia(e.target.value)}
              aria-invalid={!!errores.informacionEmergencia}
            />
            {errores.informacionEmergencia && (
              <p className="text-xs text-destructive">{errores.informacionEmergencia}</p>
            )}
          </div>
          <div className="flex gap-2">
            <Button type="button" size="sm" disabled={submitting} onClick={handleGuardar}>
              {submitting ? "Guardando..." : "Guardar"}
            </Button>
            <Button type="button" size="sm" variant="ghost" onClick={() => setEditando(false)}>
              Cancelar
            </Button>
          </div>
        </div>
      ) : datosLegales ? (
        <div className="flex flex-col gap-1 text-sm">
          <p>
            <span className="text-muted-foreground">Seguridad social:</span>{" "}
            {datosLegales.numero_seguridad_social || "-"}
          </p>
          <p>
            <span className="text-muted-foreground">Beneficiarios:</span> {datosLegales.beneficiarios || "-"}
          </p>
          <p>
            <span className="text-muted-foreground">Emergencia:</span>{" "}
            {datosLegales.informacion_emergencia || "-"}
          </p>
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">Sin datos legales registrados.</p>
      )}
    </section>
  )
}
