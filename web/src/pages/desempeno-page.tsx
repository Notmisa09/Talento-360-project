import { useCallback, useEffect, useMemo, useState } from "react"
import { toast } from "sonner"
import { AppLayout } from "@/components/app-layout"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Separator } from "@/components/ui/separator"
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
  ApiError,
  actualizarAvanceObjetivo,
  crearCicloEvaluacion,
  crearEvaluacion,
  crearObjetivo,
  listarCiclosEvaluacion,
  listarEmpleados,
  obtenerHistorialDesempeno,
} from "@/lib/api"
import { useAuth } from "@/hooks/use-auth"
import type { CicloEvaluacionOut, EmpleadoOut, EvaluacionOut, ObjetivoOut } from "@/lib/types"
import {
  recolectarErrores,
  validarLongitudMaxima,
  validarMonto,
  validarNoNegativo,
  validarRangoFechasObligatorio,
  validarRangoNumerico,
  validarRequerido,
  validarSeleccion,
} from "@/lib/validation"

export function DesempenoPage() {
  const [empleados, setEmpleados] = useState<EmpleadoOut[]>([])
  const [ciclos, setCiclos] = useState<CicloEvaluacionOut[]>([])
  const [empleadoId, setEmpleadoId] = useState("")
  const [objetivos, setObjetivos] = useState<ObjetivoOut[]>([])
  const [evaluaciones, setEvaluaciones] = useState<EvaluacionOut[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [createCicloOpen, setCreateCicloOpen] = useState(false)

  const ciclosMap = useMemo(() => new Map(ciclos.map((c) => [c.id, c.nombre])), [ciclos])
  const empleadoSeleccionado = useMemo(() => empleados.find((e) => e.id === empleadoId) ?? null, [empleados, empleadoId])

  const cargarCatalogos = useCallback(async () => {
    try {
      const [emp, cic] = await Promise.all([listarEmpleados(1, 100), listarCiclosEvaluacion()])
      setEmpleados(emp.items)
      setCiclos(cic)
    } catch {
      toast.error("No se pudieron cargar los catalogos")
    }
  }, [])

  const cargarHistorial = useCallback(async (id: string) => {
    setLoading(true)
    setError(null)
    try {
      const data = await obtenerHistorialDesempeno(id)
      setObjetivos(data.objetivos)
      setEvaluaciones(data.evaluaciones)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "No se pudo cargar el historial de desempeno")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    cargarCatalogos()
  }, [cargarCatalogos])

  useEffect(() => {
    if (empleadoId) {
      cargarHistorial(empleadoId)
    } else {
      setObjetivos([])
      setEvaluaciones([])
    }
  }, [empleadoId, cargarHistorial])

  return (
    <AppLayout title="Desempeno y KPIs">
      <div className="flex items-center justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-semibold tracking-tight">Desempeno y KPIs</h1>
          <p className="text-sm text-muted-foreground">Objetivos y evaluaciones por ciclo</p>
        </div>
        <CrearCicloDialog
          open={createCicloOpen}
          onOpenChange={setCreateCicloOpen}
          onCreated={(nuevo) => {
            setCiclos((prev) => [nuevo, ...prev])
            toast.success(`Ciclo "${nuevo.nombre}" creado`)
            setCreateCicloOpen(false)
          }}
        />
      </div>

      <section className="flex flex-col gap-2">
        <h2 className="text-sm font-medium text-muted-foreground">Ciclos de evaluacion</h2>
        {ciclos.length === 0 ? (
          <p className="text-sm text-muted-foreground">Aun no hay ciclos registrados.</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {ciclos.map((c) => (
              <Badge key={c.id} variant="secondary" className="font-normal">
                {c.nombre} ({c.fecha_inicio} - {c.fecha_fin})
              </Badge>
            ))}
          </div>
        )}
      </section>

      <Separator />

      <div className="flex flex-col gap-2">
        <Label>Empleado</Label>
        <Select value={empleadoId} onValueChange={(v) => setEmpleadoId(v ?? "")}>
          <SelectTrigger className="w-full sm:w-96">
            <SelectValue>
              {(v: string | null) => {
                if (!v) return "Selecciona un empleado para ver su desempeno"
                const emp = empleados.find((e) => e.id === v)
                return emp ? `${emp.nombres} ${emp.apellidos} (${emp.codigo_empleado})` : v
              }}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {empleados.map((e) => (
              <SelectItem key={e.id} value={e.id}>
                {e.nombres} {e.apellidos} ({e.codigo_empleado})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {empleadoSeleccionado && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <ObjetivosSection
            empleadoId={empleadoSeleccionado.id}
            ciclos={ciclos}
            objetivos={objetivos}
            loading={loading}
            ciclosMap={ciclosMap}
            onObjetivoCreado={(o) => setObjetivos((prev) => [o, ...prev])}
            onObjetivoActualizado={(o) => setObjetivos((prev) => prev.map((x) => (x.id === o.id ? o : x)))}
          />
          <EvaluacionesSection
            empleadoId={empleadoSeleccionado.id}
            ciclos={ciclos}
            evaluaciones={evaluaciones}
            loading={loading}
            ciclosMap={ciclosMap}
            onEvaluacionCreada={(e) => setEvaluaciones((prev) => [e, ...prev])}
          />
        </div>
      )}
    </AppLayout>
  )
}

function CrearCicloDialog({
  open,
  onOpenChange,
  onCreated,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  onCreated: (ciclo: CicloEvaluacionOut) => void
}) {
  const [nombre, setNombre] = useState("")
  const [fechaInicio, setFechaInicio] = useState("")
  const [fechaFin, setFechaFin] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [errores, setErrores] = useState<Record<string, string>>({})

  function resetForm() {
    setNombre("")
    setFechaInicio("")
    setFechaFin("")
    setError(null)
    setErrores({})
  }

  async function handleSubmit() {
    const nuevosErrores = recolectarErrores({
      nombre: validarLongitudMaxima(nombre, 150, "El nombre") ?? validarRequerido(nombre, "El nombre"),
      fechas: validarRangoFechasObligatorio(fechaInicio, fechaFin),
    })
    setErrores(nuevosErrores)
    if (Object.keys(nuevosErrores).length > 0) return

    setSubmitting(true)
    setError(null)
    try {
      const nuevo = await crearCicloEvaluacion({ nombre: nombre.trim(), fecha_inicio: fechaInicio, fecha_fin: fechaFin })
      resetForm()
      onCreated(nuevo)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "No se pudo crear el ciclo")
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
      <DialogTrigger render={<Button />}>+ Nuevo ciclo</DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Crear ciclo de evaluacion</DialogTitle>
          <DialogDescription>Define el periodo en el que se evaluaran objetivos y desempeno.</DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="flex flex-col gap-2">
            <Label htmlFor="ciclo-nombre">Nombre</Label>
            <Input
              id="ciclo-nombre"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              placeholder="Ej. 2026 - Semestre 1"
              aria-invalid={!!errores.nombre}
            />
            {errores.nombre && <p className="text-xs text-destructive">{errores.nombre}</p>}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-2">
              <Label htmlFor="ciclo-inicio">Fecha de inicio</Label>
              <Input
                id="ciclo-inicio"
                type="date"
                value={fechaInicio}
                onChange={(e) => setFechaInicio(e.target.value)}
                aria-invalid={!!errores.fechas}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="ciclo-fin">Fecha de fin</Label>
              <Input
                id="ciclo-fin"
                type="date"
                value={fechaFin}
                onChange={(e) => setFechaFin(e.target.value)}
                aria-invalid={!!errores.fechas}
              />
            </div>
          </div>
          {errores.fechas && <p className="text-xs text-destructive">{errores.fechas}</p>}

          <DialogFooter>
            <Button type="button" disabled={submitting} onClick={handleSubmit}>
              {submitting ? "Creando..." : "Crear ciclo"}
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  )
}

function ObjetivosSection({
  empleadoId,
  ciclos,
  objetivos,
  loading,
  ciclosMap,
  onObjetivoCreado,
  onObjetivoActualizado,
}: {
  empleadoId: string
  ciclos: CicloEvaluacionOut[]
  objetivos: ObjetivoOut[]
  loading: boolean
  ciclosMap: Map<string, string>
  onObjetivoCreado: (o: ObjetivoOut) => void
  onObjetivoActualizado: (o: ObjetivoOut) => void
}) {
  const [formOpen, setFormOpen] = useState(false)
  const [cicloId, setCicloId] = useState("")
  const [descripcion, setDescripcion] = useState("")
  const [metaValor, setMetaValor] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [errores, setErrores] = useState<Record<string, string>>({})

  async function handleCrear() {
    const nuevosErrores = recolectarErrores({
      cicloId: validarSeleccion(cicloId, "un ciclo"),
      descripcion:
        validarRequerido(descripcion, "La descripcion") ?? validarLongitudMaxima(descripcion, 1000, "La descripcion"),
      metaValor: validarMonto(metaValor, "La meta"),
    })
    setErrores(nuevosErrores)
    if (Object.keys(nuevosErrores).length > 0) return

    setSubmitting(true)
    setError(null)
    try {
      const nuevo = await crearObjetivo({
        empleado_id: empleadoId,
        ciclo_id: cicloId,
        descripcion: descripcion.trim(),
        meta_valor: Number(metaValor),
      })
      onObjetivoCreado(nuevo)
      setFormOpen(false)
      setCicloId("")
      setDescripcion("")
      setMetaValor("")
      setErrores({})
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "No se pudo registrar el objetivo")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <section className="flex flex-col gap-3 rounded-xl border border-border/60 p-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium">Objetivos</h3>
        <Button type="button" variant="ghost" size="sm" onClick={() => setFormOpen((v) => !v)} disabled={ciclos.length === 0}>
          {formOpen ? "Cancelar" : "+ Agregar"}
        </Button>
      </div>

      {ciclos.length === 0 && <p className="text-xs text-muted-foreground">Crea un ciclo de evaluacion primero.</p>}

      {formOpen && (
        <div className="flex flex-col gap-2 rounded-md border border-border/60 p-3">
          {error && <p className="text-xs text-destructive">{error}</p>}
          <Select value={cicloId} onValueChange={(v) => setCicloId(v ?? "")}>
            <SelectTrigger className="w-full" aria-invalid={!!errores.cicloId}>
              <SelectValue>
                {(v: string | null) => (v ? (ciclosMap.get(v) ?? v) : "Selecciona un ciclo")}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {ciclos.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.nombre}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errores.cicloId && <p className="text-xs text-destructive">{errores.cicloId}</p>}

          <Input
            placeholder="Descripcion del objetivo"
            value={descripcion}
            onChange={(e) => setDescripcion(e.target.value)}
            aria-invalid={!!errores.descripcion}
          />
          {errores.descripcion && <p className="text-xs text-destructive">{errores.descripcion}</p>}

          <Input
            type="number"
            min="0"
            step="0.01"
            placeholder="Meta (valor objetivo)"
            value={metaValor}
            onChange={(e) => setMetaValor(e.target.value)}
            aria-invalid={!!errores.metaValor}
          />
          {errores.metaValor && <p className="text-xs text-destructive">{errores.metaValor}</p>}

          <Button type="button" size="sm" disabled={submitting} onClick={handleCrear}>
            {submitting ? "Guardando..." : "Guardar objetivo"}
          </Button>
        </div>
      )}

      {loading ? (
        <p className="text-sm text-muted-foreground">Cargando...</p>
      ) : objetivos.length === 0 ? (
        <p className="text-sm text-muted-foreground">Sin objetivos registrados.</p>
      ) : (
        <ul className="flex flex-col gap-3">
          {objetivos.map((o) => (
            <ObjetivoCard
              key={o.id}
              objetivo={o}
              cicloNombre={ciclosMap.get(o.ciclo_id) ?? o.ciclo_id}
              onActualizado={onObjetivoActualizado}
            />
          ))}
        </ul>
      )}
    </section>
  )
}

function ObjetivoCard({
  objetivo,
  cicloNombre,
  onActualizado,
}: {
  objetivo: ObjetivoOut
  cicloNombre: string
  onActualizado: (o: ObjetivoOut) => void
}) {
  const [editando, setEditando] = useState(false)
  const [valorActual, setValorActual] = useState(String(objetivo.valor_actual))
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleGuardar() {
    const errorValidacion = validarNoNegativo(valorActual, "El avance")
    if (errorValidacion) {
      setError(errorValidacion)
      return
    }
    setSubmitting(true)
    setError(null)
    try {
      const actualizado = await actualizarAvanceObjetivo(objetivo.id, Number(valorActual))
      onActualizado(actualizado)
      setEditando(false)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "No se pudo actualizar el avance")
    } finally {
      setSubmitting(false)
    }
  }

  const progresoClamp = Math.min(100, Math.max(0, objetivo.progreso))

  return (
    <li className="rounded-md border border-border/60 p-3 text-sm">
      <div className="flex items-center justify-between gap-2">
        <p className="font-medium">{objetivo.descripcion}</p>
        <Badge variant="outline" className="font-normal">
          {cicloNombre}
        </Badge>
      </div>
      <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-accent">
        <div className="h-full bg-primary" style={{ width: `${progresoClamp}%` }} />
      </div>
      <p className="mt-1 text-xs text-muted-foreground">
        {objetivo.valor_actual} / {objetivo.meta_valor} ({objetivo.progreso.toFixed(1)}%)
      </p>

      {editando ? (
        <div className="mt-2 flex flex-col gap-2">
          <Input
            type="number"
            min="0"
            step="0.01"
            value={valorActual}
            onChange={(e) => setValorActual(e.target.value)}
          />
          {error && <p className="text-xs text-destructive">{error}</p>}
          <div className="flex gap-2">
            <Button type="button" size="sm" disabled={submitting} onClick={handleGuardar}>
              {submitting ? "Guardando..." : "Guardar"}
            </Button>
            <Button type="button" size="sm" variant="ghost" onClick={() => setEditando(false)}>
              Cancelar
            </Button>
          </div>
        </div>
      ) : (
        <button type="button" className="mt-2 text-xs text-primary hover:underline" onClick={() => setEditando(true)}>
          Actualizar avance
        </button>
      )}
    </li>
  )
}

function EvaluacionesSection({
  empleadoId,
  ciclos,
  evaluaciones,
  loading,
  ciclosMap,
  onEvaluacionCreada,
}: {
  empleadoId: string
  ciclos: CicloEvaluacionOut[]
  evaluaciones: EvaluacionOut[]
  loading: boolean
  ciclosMap: Map<string, string>
  onEvaluacionCreada: (e: EvaluacionOut) => void
}) {
  const { user } = useAuth()
  const [formOpen, setFormOpen] = useState(false)
  const [cicloId, setCicloId] = useState("")
  const [calificacion, setCalificacion] = useState("")
  const [comentarios, setComentarios] = useState("")
  const [planMejora, setPlanMejora] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [errores, setErrores] = useState<Record<string, string>>({})

  async function handleCrear() {
    const nuevosErrores = recolectarErrores({
      cicloId: validarSeleccion(cicloId, "un ciclo"),
      calificacion: validarRangoNumerico(calificacion, 0, 100, "La calificacion"),
      comentarios: validarLongitudMaxima(comentarios, 2000, "Los comentarios"),
      planMejora: validarLongitudMaxima(planMejora, 2000, "El plan de mejora"),
    })
    setErrores(nuevosErrores)
    if (Object.keys(nuevosErrores).length > 0) return
    if (!user) return

    setSubmitting(true)
    setError(null)
    try {
      const nueva = await crearEvaluacion({
        empleado_id: empleadoId,
        evaluador_id: user.id,
        ciclo_id: cicloId,
        calificacion_final: Number(calificacion),
        comentarios: comentarios.trim() || null,
        plan_mejora: planMejora.trim() || null,
      })
      onEvaluacionCreada(nueva)
      setFormOpen(false)
      setCicloId("")
      setCalificacion("")
      setComentarios("")
      setPlanMejora("")
      setErrores({})
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "No se pudo registrar la evaluacion")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <section className="flex flex-col gap-3 rounded-xl border border-border/60 p-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium">Evaluaciones</h3>
        <Button type="button" variant="ghost" size="sm" onClick={() => setFormOpen((v) => !v)} disabled={ciclos.length === 0}>
          {formOpen ? "Cancelar" : "+ Agregar"}
        </Button>
      </div>

      {ciclos.length === 0 && <p className="text-xs text-muted-foreground">Crea un ciclo de evaluacion primero.</p>}

      {formOpen && (
        <div className="flex flex-col gap-2 rounded-md border border-border/60 p-3">
          {error && <p className="text-xs text-destructive">{error}</p>}
          <Select value={cicloId} onValueChange={(v) => setCicloId(v ?? "")}>
            <SelectTrigger className="w-full" aria-invalid={!!errores.cicloId}>
              <SelectValue>
                {(v: string | null) => (v ? (ciclosMap.get(v) ?? v) : "Selecciona un ciclo")}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {ciclos.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.nombre}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errores.cicloId && <p className="text-xs text-destructive">{errores.cicloId}</p>}

          <Input
            type="number"
            min="0"
            max="100"
            step="0.1"
            placeholder="Calificacion final (0-100)"
            value={calificacion}
            onChange={(e) => setCalificacion(e.target.value)}
            aria-invalid={!!errores.calificacion}
          />
          {errores.calificacion && <p className="text-xs text-destructive">{errores.calificacion}</p>}

          <Input
            placeholder="Comentarios (opcional)"
            value={comentarios}
            onChange={(e) => setComentarios(e.target.value)}
            aria-invalid={!!errores.comentarios}
          />
          {errores.comentarios && <p className="text-xs text-destructive">{errores.comentarios}</p>}

          <Input
            placeholder="Plan de mejora (opcional)"
            value={planMejora}
            onChange={(e) => setPlanMejora(e.target.value)}
            aria-invalid={!!errores.planMejora}
          />
          {errores.planMejora && <p className="text-xs text-destructive">{errores.planMejora}</p>}

          <Button type="button" size="sm" disabled={submitting} onClick={handleCrear}>
            {submitting ? "Guardando..." : "Guardar evaluacion"}
          </Button>
        </div>
      )}

      {loading ? (
        <p className="text-sm text-muted-foreground">Cargando...</p>
      ) : evaluaciones.length === 0 ? (
        <p className="text-sm text-muted-foreground">Sin evaluaciones registradas.</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {evaluaciones.map((e) => (
            <li key={e.id} className="rounded-md border border-border/60 p-2 text-sm">
              <div className="flex items-center justify-between">
                <Badge variant={e.calificacion_final >= 70 ? "outline" : "destructive"} className="font-normal">
                  {e.calificacion_final.toFixed(1)} / 100
                </Badge>
                <span className="text-xs text-muted-foreground">{ciclosMap.get(e.ciclo_id) ?? e.ciclo_id}</span>
              </div>
              {e.comentarios && <p className="mt-1 text-muted-foreground">{e.comentarios}</p>}
              {e.plan_mejora && (
                <p className="mt-1 text-xs text-muted-foreground">
                  <span className="font-medium">Plan de mejora:</span> {e.plan_mejora}
                </p>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
