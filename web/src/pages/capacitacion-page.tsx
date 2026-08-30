import { useCallback, useEffect, useMemo, useState } from "react"
import { toast } from "sonner"
import { AppLayout } from "@/components/app-layout"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Separator } from "@/components/ui/separator"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
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
  ApiError,
  actualizarProgresoInscripcion,
  crearCurso,
  descargarCertificado,
  inscribirEmpleadoACurso,
  listarCursos,
  listarEmpleados,
  listarInscripcionesDeCurso,
} from "@/lib/api"
import type { CursoOut, EmpleadoOut, InscripcionOut } from "@/lib/types"
import { recolectarErrores, validarLongitudMaxima, validarRangoNumerico, validarRequerido, validarSeleccion } from "@/lib/validation"

export function CapacitacionPage() {
  const [cursos, setCursos] = useState<CursoOut[]>([])
  const [empleados, setEmpleados] = useState<EmpleadoOut[]>([])
  const [cursoId, setCursoId] = useState("")
  const [inscripciones, setInscripciones] = useState<InscripcionOut[]>([])
  const [loading, setLoading] = useState(false)
  const [createOpen, setCreateOpen] = useState(false)
  const [inscribirOpen, setInscribirOpen] = useState(false)

  const empleadosMap = useMemo(() => new Map(empleados.map((e) => [e.id, `${e.nombres} ${e.apellidos}`])), [empleados])
  const cursoSeleccionado = useMemo(() => cursos.find((c) => c.id === cursoId) ?? null, [cursos, cursoId])

  const cargarCatalogos = useCallback(async () => {
    try {
      const [c, e] = await Promise.all([listarCursos(), listarEmpleados(1, 100)])
      setCursos(c)
      setEmpleados(e.items)
    } catch {
      toast.error("No se pudieron cargar los catalogos")
    }
  }, [])

  const cargarInscripciones = useCallback(async (id: string) => {
    setLoading(true)
    try {
      setInscripciones(await listarInscripcionesDeCurso(id))
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "No se pudieron cargar las inscripciones")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    cargarCatalogos()
  }, [cargarCatalogos])

  useEffect(() => {
    if (cursoId) cargarInscripciones(cursoId)
    else setInscripciones([])
  }, [cursoId, cargarInscripciones])

  return (
    <AppLayout title="Capacitacion (LMS)">
      <div className="flex items-center justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-semibold tracking-tight">Capacitacion</h1>
          <p className="text-sm text-muted-foreground">Cursos e inscripciones de empleados</p>
        </div>
        <CrearCursoDialog
          open={createOpen}
          onOpenChange={setCreateOpen}
          onCreated={(nuevo) => {
            setCursos((prev) => [...prev, nuevo].sort((a, b) => a.nombre.localeCompare(b.nombre)))
            toast.success(`Curso "${nuevo.nombre}" creado`)
            setCreateOpen(false)
          }}
        />
      </div>

      <div className="flex flex-wrap items-end gap-3">
        <div className="flex flex-col gap-2">
          <Label>Curso</Label>
          <Select value={cursoId} onValueChange={(v) => setCursoId(v ?? "")}>
            <SelectTrigger className="w-full sm:w-96">
              <SelectValue>{(v: string | null) => cursos.find((c) => c.id === v)?.nombre ?? "Selecciona un curso"}</SelectValue>
            </SelectTrigger>
            <SelectContent>
              {cursos.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.nombre} {c.obligatorio && "(obligatorio)"}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        {cursoSeleccionado && (
          <InscribirDialog
            open={inscribirOpen}
            onOpenChange={setInscribirOpen}
            cursoId={cursoSeleccionado.id}
            empleados={empleados}
            inscritos={new Set(inscripciones.map((i) => i.empleado_id))}
            onInscrito={(nueva) => {
              setInscripciones((prev) => [nueva, ...prev])
              toast.success("Empleado inscrito")
              setInscribirOpen(false)
            }}
          />
        )}
      </div>

      {cursoSeleccionado && (
        <>
          <p className="text-sm text-muted-foreground">
            {cursoSeleccionado.descripcion || "Sin descripcion"} - {cursoSeleccionado.duracion_horas}h
          </p>
          <Separator />
          <section className="flex flex-col gap-2">
            <h2 className="text-sm font-medium text-muted-foreground">Inscripciones</h2>
            {loading ? (
              <p className="text-sm text-muted-foreground">Cargando...</p>
            ) : inscripciones.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nadie esta inscrito en este curso todavia.</p>
            ) : (
              <ul className="flex flex-col gap-2">
                {inscripciones.map((i) => (
                  <InscripcionCard
                    key={i.id}
                    inscripcion={i}
                    nombreEmpleado={empleadosMap.get(i.empleado_id) ?? i.empleado_id}
                    onActualizada={(actualizada) =>
                      setInscripciones((prev) => prev.map((x) => (x.id === actualizada.id ? actualizada : x)))
                    }
                  />
                ))}
              </ul>
            )}
          </section>
        </>
      )}
    </AppLayout>
  )
}

function InscripcionCard({
  inscripcion,
  nombreEmpleado,
  onActualizada,
}: {
  inscripcion: InscripcionOut
  nombreEmpleado: string
  onActualizada: (i: InscripcionOut) => void
}) {
  const [editando, setEditando] = useState(false)
  const [progreso, setProgreso] = useState(String(inscripcion.progreso))
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [descargando, setDescargando] = useState(false)

  async function handleGuardar() {
    const errorValidacion = validarRangoNumerico(progreso, 0, 100, "El progreso")
    if (errorValidacion) {
      setError(errorValidacion)
      return
    }
    setSubmitting(true)
    setError(null)
    try {
      const actualizada = await actualizarProgresoInscripcion(inscripcion.id, Number(progreso))
      onActualizada(actualizada)
      setEditando(false)
      if (actualizada.estado === "COMPLETADO") toast.success(`${nombreEmpleado} completo el curso`)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "No se pudo actualizar el progreso")
    } finally {
      setSubmitting(false)
    }
  }

  async function handleDescargarCertificado() {
    setDescargando(true)
    try {
      await descargarCertificado(inscripcion.id)
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "No se pudo descargar el certificado")
    } finally {
      setDescargando(false)
    }
  }

  return (
    <li className="rounded-md border border-border/60 p-3 text-sm">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="font-medium">{nombreEmpleado}</p>
          <p className="text-xs text-muted-foreground">
            {inscripcion.progreso}% - {inscripcion.estado}
          </p>
        </div>
        <div className="flex gap-2">
          {inscripcion.estado === "COMPLETADO" ? (
            <Button type="button" size="sm" variant="outline" disabled={descargando} onClick={handleDescargarCertificado}>
              {descargando ? "Descargando..." : "Descargar certificado"}
            </Button>
          ) : (
            <Button type="button" size="sm" variant="ghost" onClick={() => setEditando((v) => !v)}>
              {editando ? "Cancelar" : "Actualizar progreso"}
            </Button>
          )}
        </div>
      </div>
      <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-accent">
        <div className="h-full bg-primary" style={{ width: `${Math.min(100, Math.max(0, inscripcion.progreso))}%` }} />
      </div>
      {editando && (
        <div className="mt-2 flex flex-col gap-2">
          <Input type="number" min="0" max="100" step="1" value={progreso} onChange={(e) => setProgreso(e.target.value)} />
          {error && <p className="text-xs text-destructive">{error}</p>}
          <Button type="button" size="sm" disabled={submitting} onClick={handleGuardar}>
            {submitting ? "Guardando..." : "Guardar"}
          </Button>
        </div>
      )}
    </li>
  )
}

function CrearCursoDialog({
  open,
  onOpenChange,
  onCreated,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  onCreated: (curso: CursoOut) => void
}) {
  const [nombre, setNombre] = useState("")
  const [descripcion, setDescripcion] = useState("")
  const [duracionHoras, setDuracionHoras] = useState("")
  const [obligatorio, setObligatorio] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [errores, setErrores] = useState<Record<string, string>>({})

  function resetForm() {
    setNombre("")
    setDescripcion("")
    setDuracionHoras("")
    setObligatorio(false)
    setError(null)
    setErrores({})
  }

  async function handleSubmit() {
    const nuevosErrores = recolectarErrores({
      nombre: validarRequerido(nombre, "El nombre") ?? validarLongitudMaxima(nombre, 150, "El nombre"),
      descripcion: validarLongitudMaxima(descripcion, 2000, "La descripcion"),
      duracionHoras: validarRangoNumerico(duracionHoras, 1, 2000, "La duracion"),
    })
    setErrores(nuevosErrores)
    if (Object.keys(nuevosErrores).length > 0) return

    setSubmitting(true)
    setError(null)
    try {
      const nuevo = await crearCurso({
        nombre: nombre.trim(),
        descripcion: descripcion.trim() || null,
        duracion_horas: Number(duracionHoras),
        obligatorio,
      })
      resetForm()
      onCreated(nuevo)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "No se pudo crear el curso")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(next) => { if (!next) resetForm(); onOpenChange(next) }}>
      <DialogTrigger render={<Button />}>+ Nuevo curso</DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Crear curso</DialogTitle>
          <DialogDescription>Define un curso de capacitacion para el catalogo.</DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="flex flex-col gap-2">
            <Label htmlFor="curso-nombre">Nombre</Label>
            <Input id="curso-nombre" value={nombre} onChange={(e) => setNombre(e.target.value)} aria-invalid={!!errores.nombre} />
            {errores.nombre && <p className="text-xs text-destructive">{errores.nombre}</p>}
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="curso-descripcion">Descripcion (opcional)</Label>
            <Input id="curso-descripcion" value={descripcion} onChange={(e) => setDescripcion(e.target.value)} aria-invalid={!!errores.descripcion} />
            {errores.descripcion && <p className="text-xs text-destructive">{errores.descripcion}</p>}
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="curso-duracion">Duracion (horas)</Label>
            <Input id="curso-duracion" type="number" min="1" value={duracionHoras} onChange={(e) => setDuracionHoras(e.target.value)} aria-invalid={!!errores.duracionHoras} />
            {errores.duracionHoras && <p className="text-xs text-destructive">{errores.duracionHoras}</p>}
          </div>

          <div className="flex items-center gap-2">
            <Switch checked={obligatorio} onCheckedChange={(v) => setObligatorio(!!v)} id="curso-obligatorio" />
            <Label htmlFor="curso-obligatorio">Curso obligatorio</Label>
          </div>

          <DialogFooter>
            <Button type="button" disabled={submitting} onClick={handleSubmit}>
              {submitting ? "Creando..." : "Crear curso"}
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  )
}

function InscribirDialog({
  open,
  onOpenChange,
  cursoId,
  empleados,
  inscritos,
  onInscrito,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  cursoId: string
  empleados: EmpleadoOut[]
  inscritos: Set<string>
  onInscrito: (inscripcion: InscripcionOut) => void
}) {
  const [empleadoId, setEmpleadoId] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [errorSeleccion, setErrorSeleccion] = useState<string | null>(null)

  const disponibles = empleados.filter((e) => !inscritos.has(e.id))

  async function handleSubmit() {
    const err = validarSeleccion(empleadoId, "un empleado")
    setErrorSeleccion(err)
    if (err) return

    setSubmitting(true)
    setError(null)
    try {
      const nueva = await inscribirEmpleadoACurso(cursoId, empleadoId)
      setEmpleadoId("")
      onInscrito(nueva)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "No se pudo inscribir al empleado")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger render={<Button variant="outline" />}>+ Inscribir empleado</DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Inscribir empleado</DialogTitle>
          <DialogDescription>Selecciona un empleado para inscribirlo en este curso.</DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <Select value={empleadoId} onValueChange={(v) => setEmpleadoId(v ?? "")}>
            <SelectTrigger className="w-full" aria-invalid={!!errorSeleccion}>
              <SelectValue>
                {(v: string | null) => {
                  const emp = empleados.find((e) => e.id === v)
                  return emp ? `${emp.nombres} ${emp.apellidos}` : "Selecciona un empleado"
                }}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {disponibles.map((e) => (
                <SelectItem key={e.id} value={e.id}>
                  {e.nombres} {e.apellidos}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errorSeleccion && <p className="text-xs text-destructive">{errorSeleccion}</p>}

          <DialogFooter>
            <Button type="button" disabled={submitting} onClick={handleSubmit}>
              {submitting ? "Inscribiendo..." : "Inscribir"}
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  )
}
