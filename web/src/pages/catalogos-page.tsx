import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react"
import { Pencil, Plus, Trash2 } from "lucide-react"
import { toast } from "sonner"
import { AppLayout } from "@/components/app-layout"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Card, CardAction, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
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
  ApiError,
  actualizarDepartamento,
  actualizarPuesto,
  actualizarSucursal,
  crearDepartamento,
  crearPuesto,
  crearSucursal,
  eliminarDepartamento,
  eliminarPuesto,
  eliminarSucursal,
  listarDepartamentos,
  listarPuestos,
  listarSucursales,
} from "@/lib/api"
import type { DepartamentoOut, PuestoOut, SucursalOut } from "@/lib/types"
import {
  recolectarErrores,
  validarLongitudMaxima,
  validarMonto,
  validarNombre,
  validarSeleccion,
} from "@/lib/validation"

export function CatalogosPage() {
  const [sucursales, setSucursales] = useState<SucursalOut[]>([])
  const [departamentos, setDepartamentos] = useState<DepartamentoOut[]>([])
  const [puestos, setPuestos] = useState<PuestoOut[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const departamentosMap = useMemo(() => new Map(departamentos.map((d) => [d.id, d.nombre])), [departamentos])

  const cargar = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [suc, dep, pue] = await Promise.all([listarSucursales(), listarDepartamentos(), listarPuestos()])
      setSucursales(suc)
      setDepartamentos(dep)
      setPuestos(pue)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "No se pudieron cargar los catalogos")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    cargar()
  }, [cargar])

  return (
    <AppLayout title="Catalogos">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-tight">Catalogos</h1>
        <p className="text-sm text-muted-foreground">
          Administra las sucursales, departamentos y puestos que se usan en Empleados y Reclutamiento.
        </p>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertTitle>No se pudieron cargar los catalogos</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <SucursalesSection
        sucursales={sucursales}
        loading={loading}
        onCreada={(s) => {
          setSucursales((prev) => [...prev, s])
          toast.success(`Sucursal ${s.nombre} creada`)
        }}
        onActualizada={(s) => {
          setSucursales((prev) => prev.map((x) => (x.id === s.id ? s : x)))
          toast.success(`Sucursal ${s.nombre} actualizada`)
        }}
        onEliminada={(s) => {
          setSucursales((prev) => prev.filter((x) => x.id !== s.id))
          toast.success(`Sucursal ${s.nombre} eliminada`)
        }}
      />

      <DepartamentosSection
        departamentos={departamentos}
        loading={loading}
        onCreado={(d) => {
          setDepartamentos((prev) => [...prev, d])
          toast.success(`Departamento ${d.nombre} creado`)
        }}
        onActualizado={(d) => {
          setDepartamentos((prev) => prev.map((x) => (x.id === d.id ? d : x)))
          toast.success(`Departamento ${d.nombre} actualizado`)
        }}
        onEliminado={(d) => {
          setDepartamentos((prev) => prev.filter((x) => x.id !== d.id))
          toast.success(`Departamento ${d.nombre} eliminado`)
        }}
      />

      <PuestosSection
        puestos={puestos}
        departamentos={departamentos}
        departamentosMap={departamentosMap}
        loading={loading}
        onCreado={(p) => {
          setPuestos((prev) => [...prev, p])
          toast.success(`Puesto ${p.titulo} creado`)
        }}
        onActualizado={(p) => {
          setPuestos((prev) => prev.map((x) => (x.id === p.id ? p : x)))
          toast.success(`Puesto ${p.titulo} actualizado`)
        }}
        onEliminado={(p) => {
          setPuestos((prev) => prev.filter((x) => x.id !== p.id))
          toast.success(`Puesto ${p.titulo} eliminado`)
        }}
      />
    </AppLayout>
  )
}

function SucursalesSection({
  sucursales,
  loading,
  onCreada,
  onActualizada,
  onEliminada,
}: {
  sucursales: SucursalOut[]
  loading: boolean
  onCreada: (s: SucursalOut) => void
  onActualizada: (s: SucursalOut) => void
  onEliminada: (s: SucursalOut) => void
}) {
  const [createOpen, setCreateOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<SucursalOut | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<SucursalOut | null>(null)
  const [deleting, setDeleting] = useState(false)

  async function handleEliminar() {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      await eliminarSucursal(deleteTarget.id)
      onEliminada(deleteTarget)
      setDeleteTarget(null)
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "No se pudo eliminar la sucursal")
    } finally {
      setDeleting(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Sucursales ({sucursales.length})</CardTitle>
        <CardAction>
          <Dialog open={createOpen} onOpenChange={setCreateOpen}>
            <DialogTrigger render={<Button size="sm" />}>
              <Plus />
              Nueva sucursal
            </DialogTrigger>
            <SucursalFormDialog
              onSubmit={crearSucursal}
              onDone={(s) => {
                onCreada(s)
                setCreateOpen(false)
              }}
              titulo="Nueva sucursal"
              descripcion="Registra una sucursal para asignarla a empleados y vacantes."
              textoBoton="Crear sucursal"
            />
          </Dialog>
        </CardAction>
      </CardHeader>
      <CardContent>
        <div className="rounded-xl border border-border/60">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nombre</TableHead>
                <TableHead>Ciudad</TableHead>
                <TableHead>Direccion</TableHead>
                <TableHead className="w-10" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={4} className="h-16 text-center text-muted-foreground">
                    Cargando...
                  </TableCell>
                </TableRow>
              ) : sucursales.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="h-16 text-center text-muted-foreground">
                    No hay sucursales registradas
                  </TableCell>
                </TableRow>
              ) : (
                sucursales.map((s) => (
                  <TableRow key={s.id}>
                    <TableCell className="font-medium">{s.nombre}</TableCell>
                    <TableCell className="text-muted-foreground">{s.ciudad ?? "-"}</TableCell>
                    <TableCell className="text-muted-foreground">{s.direccion ?? "-"}</TableCell>
                    <TableCell className="flex gap-1">
                      <Button variant="ghost" size="icon-sm" onClick={() => setEditTarget(s)}>
                        <Pencil />
                        <span className="sr-only">Editar</span>
                      </Button>
                      <Button variant="ghost" size="icon-sm" onClick={() => setDeleteTarget(s)}>
                        <Trash2 />
                        <span className="sr-only">Eliminar</span>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>

      <Dialog
        open={editTarget !== null}
        onOpenChange={(open) => {
          if (!open) setEditTarget(null)
        }}
      >
        {editTarget && (
          <SucursalFormDialog
            valorInicial={editTarget}
            onSubmit={(data) => actualizarSucursal(editTarget.id, data)}
            onDone={(s) => {
              onActualizada(s)
              setEditTarget(null)
            }}
            titulo="Editar sucursal"
            descripcion={editTarget.nombre}
            textoBoton="Guardar cambios"
          />
        )}
      </Dialog>

      <AlertDialog
        open={deleteTarget !== null}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null)
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Eliminar sucursal</AlertDialogTitle>
            <AlertDialogDescription>
              Se eliminara "{deleteTarget?.nombre}" permanentemente. Si esta asignada a algun empleado o
              vacante, no se podra eliminar.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction variant="destructive" disabled={deleting} onClick={handleEliminar}>
              {deleting ? "Eliminando..." : "Eliminar"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  )
}

function SucursalFormDialog({
  valorInicial,
  onSubmit,
  onDone,
  titulo,
  descripcion,
  textoBoton,
}: {
  valorInicial?: SucursalOut
  onSubmit: (data: { nombre: string; ciudad: string | null; direccion: string | null }) => Promise<SucursalOut>
  onDone: (s: SucursalOut) => void
  titulo: string
  descripcion: string
  textoBoton: string
}) {
  const [nombre, setNombre] = useState(valorInicial?.nombre ?? "")
  const [ciudad, setCiudad] = useState(valorInicial?.ciudad ?? "")
  const [direccion, setDireccion] = useState(valorInicial?.direccion ?? "")
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [errores, setErrores] = useState<Record<string, string>>({})

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setError(null)
    const nuevosErrores = recolectarErrores({
      nombre: validarNombre(nombre, "El nombre"),
      direccion: validarLongitudMaxima(direccion, 255, "La direccion"),
    })
    setErrores(nuevosErrores)
    if (Object.keys(nuevosErrores).length > 0) return

    setSubmitting(true)
    try {
      const resultado = await onSubmit({
        nombre: nombre.trim(),
        ciudad: ciudad.trim() || null,
        direccion: direccion.trim() || null,
      })
      onDone(resultado)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "No se pudo guardar la sucursal")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <DialogContent>
      <DialogHeader>
        <DialogTitle>{titulo}</DialogTitle>
        <DialogDescription>{descripcion}</DialogDescription>
      </DialogHeader>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {error && (
          <Alert variant="destructive">
            <AlertTitle>No se pudo guardar</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        <div className="flex flex-col gap-2">
          <Label htmlFor="suc-nombre">Nombre</Label>
          <Input id="suc-nombre" value={nombre} onChange={(e) => setNombre(e.target.value)} aria-invalid={!!errores.nombre} />
          {errores.nombre && <p className="text-xs text-destructive">{errores.nombre}</p>}
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="suc-ciudad">Ciudad</Label>
          <Input id="suc-ciudad" value={ciudad} onChange={(e) => setCiudad(e.target.value)} />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="suc-direccion">Direccion</Label>
          <Input id="suc-direccion" value={direccion} onChange={(e) => setDireccion(e.target.value)} aria-invalid={!!errores.direccion} />
          {errores.direccion && <p className="text-xs text-destructive">{errores.direccion}</p>}
        </div>
        <DialogFooter>
          <Button type="submit" disabled={submitting}>
            {submitting ? "Guardando..." : textoBoton}
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  )
}

function DepartamentosSection({
  departamentos,
  loading,
  onCreado,
  onActualizado,
  onEliminado,
}: {
  departamentos: DepartamentoOut[]
  loading: boolean
  onCreado: (d: DepartamentoOut) => void
  onActualizado: (d: DepartamentoOut) => void
  onEliminado: (d: DepartamentoOut) => void
}) {
  const [createOpen, setCreateOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<DepartamentoOut | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<DepartamentoOut | null>(null)
  const [deleting, setDeleting] = useState(false)

  async function handleEliminar() {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      await eliminarDepartamento(deleteTarget.id)
      onEliminado(deleteTarget)
      setDeleteTarget(null)
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "No se pudo eliminar el departamento")
    } finally {
      setDeleting(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Departamentos ({departamentos.length})</CardTitle>
        <CardAction>
          <Dialog open={createOpen} onOpenChange={setCreateOpen}>
            <DialogTrigger render={<Button size="sm" />}>
              <Plus />
              Nuevo departamento
            </DialogTrigger>
            <DepartamentoFormDialog
              onSubmit={crearDepartamento}
              onDone={(d) => {
                onCreado(d)
                setCreateOpen(false)
              }}
              titulo="Nuevo departamento"
              descripcion="Registra un departamento para asignarlo a empleados, puestos y vacantes."
              textoBoton="Crear departamento"
            />
          </Dialog>
        </CardAction>
      </CardHeader>
      <CardContent>
        <div className="rounded-xl border border-border/60">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nombre</TableHead>
                <TableHead className="w-10" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={2} className="h-16 text-center text-muted-foreground">
                    Cargando...
                  </TableCell>
                </TableRow>
              ) : departamentos.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={2} className="h-16 text-center text-muted-foreground">
                    No hay departamentos registrados
                  </TableCell>
                </TableRow>
              ) : (
                departamentos.map((d) => (
                  <TableRow key={d.id}>
                    <TableCell className="font-medium">{d.nombre}</TableCell>
                    <TableCell className="flex gap-1">
                      <Button variant="ghost" size="icon-sm" onClick={() => setEditTarget(d)}>
                        <Pencil />
                        <span className="sr-only">Editar</span>
                      </Button>
                      <Button variant="ghost" size="icon-sm" onClick={() => setDeleteTarget(d)}>
                        <Trash2 />
                        <span className="sr-only">Eliminar</span>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>

      <Dialog
        open={editTarget !== null}
        onOpenChange={(open) => {
          if (!open) setEditTarget(null)
        }}
      >
        {editTarget && (
          <DepartamentoFormDialog
            valorInicial={editTarget}
            onSubmit={(data) => actualizarDepartamento(editTarget.id, data)}
            onDone={(d) => {
              onActualizado(d)
              setEditTarget(null)
            }}
            titulo="Editar departamento"
            descripcion={editTarget.nombre}
            textoBoton="Guardar cambios"
          />
        )}
      </Dialog>

      <AlertDialog
        open={deleteTarget !== null}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null)
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Eliminar departamento</AlertDialogTitle>
            <AlertDialogDescription>
              Se eliminara "{deleteTarget?.nombre}" permanentemente. Si tiene empleados, puestos o vacantes
              asignados, no se podra eliminar.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction variant="destructive" disabled={deleting} onClick={handleEliminar}>
              {deleting ? "Eliminando..." : "Eliminar"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  )
}

function DepartamentoFormDialog({
  valorInicial,
  onSubmit,
  onDone,
  titulo,
  descripcion,
  textoBoton,
}: {
  valorInicial?: DepartamentoOut
  onSubmit: (data: { nombre: string }) => Promise<DepartamentoOut>
  onDone: (d: DepartamentoOut) => void
  titulo: string
  descripcion: string
  textoBoton: string
}) {
  const [nombre, setNombre] = useState(valorInicial?.nombre ?? "")
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [errores, setErrores] = useState<Record<string, string>>({})

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setError(null)
    const nuevosErrores = recolectarErrores({ nombre: validarNombre(nombre, "El nombre") })
    setErrores(nuevosErrores)
    if (Object.keys(nuevosErrores).length > 0) return

    setSubmitting(true)
    try {
      const resultado = await onSubmit({ nombre: nombre.trim() })
      onDone(resultado)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "No se pudo guardar el departamento")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <DialogContent>
      <DialogHeader>
        <DialogTitle>{titulo}</DialogTitle>
        <DialogDescription>{descripcion}</DialogDescription>
      </DialogHeader>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {error && (
          <Alert variant="destructive">
            <AlertTitle>No se pudo guardar</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        <div className="flex flex-col gap-2">
          <Label htmlFor="dep-nombre">Nombre</Label>
          <Input id="dep-nombre" value={nombre} onChange={(e) => setNombre(e.target.value)} aria-invalid={!!errores.nombre} />
          {errores.nombre && <p className="text-xs text-destructive">{errores.nombre}</p>}
        </div>
        <DialogFooter>
          <Button type="submit" disabled={submitting}>
            {submitting ? "Guardando..." : textoBoton}
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  )
}

function PuestosSection({
  puestos,
  departamentos,
  departamentosMap,
  loading,
  onCreado,
  onActualizado,
  onEliminado,
}: {
  puestos: PuestoOut[]
  departamentos: DepartamentoOut[]
  departamentosMap: Map<string, string>
  loading: boolean
  onCreado: (p: PuestoOut) => void
  onActualizado: (p: PuestoOut) => void
  onEliminado: (p: PuestoOut) => void
}) {
  const [createOpen, setCreateOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<PuestoOut | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<PuestoOut | null>(null)
  const [deleting, setDeleting] = useState(false)

  async function handleEliminar() {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      await eliminarPuesto(deleteTarget.id)
      onEliminado(deleteTarget)
      setDeleteTarget(null)
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "No se pudo eliminar el puesto")
    } finally {
      setDeleting(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Puestos ({puestos.length})</CardTitle>
        <CardAction>
          <Dialog open={createOpen} onOpenChange={setCreateOpen}>
            <DialogTrigger render={<Button size="sm" disabled={departamentos.length === 0} />}>
              <Plus />
              Nuevo puesto
            </DialogTrigger>
            <PuestoFormDialog
              departamentos={departamentos}
              onSubmit={crearPuesto}
              onDone={(p) => {
                onCreado(p)
                setCreateOpen(false)
              }}
              titulo="Nuevo puesto"
              descripcion="Registra un puesto y su salario base dentro de un departamento."
              textoBoton="Crear puesto"
            />
          </Dialog>
        </CardAction>
      </CardHeader>
      <CardContent className="flex flex-col gap-2">
        {departamentos.length === 0 && !loading && (
          <p className="text-xs text-muted-foreground">Registra primero un departamento para poder crear puestos.</p>
        )}
        <div className="rounded-xl border border-border/60">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Titulo</TableHead>
                <TableHead>Departamento</TableHead>
                <TableHead>Salario base</TableHead>
                <TableHead className="w-10" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={4} className="h-16 text-center text-muted-foreground">
                    Cargando...
                  </TableCell>
                </TableRow>
              ) : puestos.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="h-16 text-center text-muted-foreground">
                    No hay puestos registrados
                  </TableCell>
                </TableRow>
              ) : (
                puestos.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell className="font-medium">{p.titulo}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {departamentosMap.get(p.departamento_id) ?? "-"}
                    </TableCell>
                    <TableCell className="text-muted-foreground">RD$ {p.salario_base.toLocaleString()}</TableCell>
                    <TableCell className="flex gap-1">
                      <Button variant="ghost" size="icon-sm" onClick={() => setEditTarget(p)}>
                        <Pencil />
                        <span className="sr-only">Editar</span>
                      </Button>
                      <Button variant="ghost" size="icon-sm" onClick={() => setDeleteTarget(p)}>
                        <Trash2 />
                        <span className="sr-only">Eliminar</span>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>

      <Dialog
        open={editTarget !== null}
        onOpenChange={(open) => {
          if (!open) setEditTarget(null)
        }}
      >
        {editTarget && (
          <PuestoFormDialog
            departamentos={departamentos}
            valorInicial={editTarget}
            onSubmit={(data) => actualizarPuesto(editTarget.id, data)}
            onDone={(p) => {
              onActualizado(p)
              setEditTarget(null)
            }}
            titulo="Editar puesto"
            descripcion={editTarget.titulo}
            textoBoton="Guardar cambios"
          />
        )}
      </Dialog>

      <AlertDialog
        open={deleteTarget !== null}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null)
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Eliminar puesto</AlertDialogTitle>
            <AlertDialogDescription>
              Se eliminara "{deleteTarget?.titulo}" permanentemente. Si tiene empleados asignados, no se
              podra eliminar.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction variant="destructive" disabled={deleting} onClick={handleEliminar}>
              {deleting ? "Eliminando..." : "Eliminar"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  )
}

function PuestoFormDialog({
  departamentos,
  valorInicial,
  onSubmit,
  onDone,
  titulo,
  descripcion,
  textoBoton,
}: {
  departamentos: DepartamentoOut[]
  valorInicial?: PuestoOut
  onSubmit: (data: {
    titulo: string
    salario_base: number
    descripcion: string | null
    departamento_id: string
  }) => Promise<PuestoOut>
  onDone: (p: PuestoOut) => void
  titulo: string
  descripcion: string
  textoBoton: string
}) {
  const [tituloPuesto, setTituloPuesto] = useState(valorInicial?.titulo ?? "")
  const [salario, setSalario] = useState(valorInicial ? String(valorInicial.salario_base) : "")
  const [departamentoId, setDepartamentoId] = useState(valorInicial?.departamento_id ?? "")
  const [descripcionPuesto, setDescripcionPuesto] = useState(valorInicial?.descripcion ?? "")
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [errores, setErrores] = useState<Record<string, string>>({})

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setError(null)
    const nuevosErrores = recolectarErrores({
      titulo: validarNombre(tituloPuesto, "El titulo"),
      salario: validarMonto(salario, "El salario base"),
      departamentoId: validarSeleccion(departamentoId, "un departamento"),
    })
    setErrores(nuevosErrores)
    if (Object.keys(nuevosErrores).length > 0) return

    setSubmitting(true)
    try {
      const resultado = await onSubmit({
        titulo: tituloPuesto.trim(),
        salario_base: Number(salario),
        descripcion: descripcionPuesto.trim() || null,
        departamento_id: departamentoId,
      })
      onDone(resultado)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "No se pudo guardar el puesto")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <DialogContent>
      <DialogHeader>
        <DialogTitle>{titulo}</DialogTitle>
        <DialogDescription>{descripcion}</DialogDescription>
      </DialogHeader>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {error && (
          <Alert variant="destructive">
            <AlertTitle>No se pudo guardar</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        <div className="flex flex-col gap-2">
          <Label htmlFor="pue-titulo">Titulo</Label>
          <Input
            id="pue-titulo"
            value={tituloPuesto}
            onChange={(e) => setTituloPuesto(e.target.value)}
            aria-invalid={!!errores.titulo}
          />
          {errores.titulo && <p className="text-xs text-destructive">{errores.titulo}</p>}
        </div>
        <div className="flex flex-col gap-2">
          <Label>Departamento</Label>
          <Select value={departamentoId} onValueChange={(v) => setDepartamentoId(v ?? "")}>
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
          <Label htmlFor="pue-salario">Salario base</Label>
          <Input
            id="pue-salario"
            type="number"
            min="0"
            step="0.01"
            value={salario}
            onChange={(e) => setSalario(e.target.value)}
            aria-invalid={!!errores.salario}
          />
          {errores.salario && <p className="text-xs text-destructive">{errores.salario}</p>}
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="pue-descripcion">Descripcion (opcional)</Label>
          <Input id="pue-descripcion" value={descripcionPuesto} onChange={(e) => setDescripcionPuesto(e.target.value)} />
        </div>
        <DialogFooter>
          <Button type="submit" disabled={submitting}>
            {submitting ? "Guardando..." : textoBoton}
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  )
}
