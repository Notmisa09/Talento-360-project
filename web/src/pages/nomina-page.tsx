import { useCallback, useEffect, useMemo, useState } from "react"
import { toast } from "sonner"
import { AppLayout } from "@/components/app-layout"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Separator } from "@/components/ui/separator"
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
  cerrarPeriodoNomina,
  crearPeriodoNomina,
  descargarVolante,
  listarEmpleados,
  listarNominasDeEmpleado,
  listarPeriodosNomina,
  obtenerNomina,
  procesarPeriodoNomina,
} from "@/lib/api"
import type { EmpleadoOut, NominaDetalleOut, NominaOut, PeriodoNominaOut } from "@/lib/types"
import { recolectarErrores, validarRangoFechasObligatorio } from "@/lib/validation"

export function NominaPage() {
  const [periodos, setPeriodos] = useState<PeriodoNominaOut[]>([])
  const [empleados, setEmpleados] = useState<EmpleadoOut[]>([])
  const [empleadoId, setEmpleadoId] = useState("")
  const [nominas, setNominas] = useState<NominaOut[]>([])
  const [loadingNominas, setLoadingNominas] = useState(false)
  const [createOpen, setCreateOpen] = useState(false)
  const [procesandoId, setProcesandoId] = useState<string | null>(null)

  const empleadoSeleccionado = useMemo(() => empleados.find((e) => e.id === empleadoId) ?? null, [empleados, empleadoId])

  const cargarPeriodos = useCallback(async () => {
    try {
      setPeriodos(await listarPeriodosNomina())
    } catch {
      toast.error("No se pudieron cargar los periodos de nomina")
    }
  }, [])

  const cargarEmpleados = useCallback(async () => {
    try {
      const res = await listarEmpleados(1, 100)
      setEmpleados(res.items)
    } catch {
      toast.error("No se pudieron cargar los empleados")
    }
  }, [])

  const cargarNominas = useCallback(async (id: string) => {
    setLoadingNominas(true)
    try {
      setNominas(await listarNominasDeEmpleado(id))
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "No se pudieron cargar las nominas")
    } finally {
      setLoadingNominas(false)
    }
  }, [])

  useEffect(() => {
    cargarPeriodos()
    cargarEmpleados()
  }, [cargarPeriodos, cargarEmpleados])

  useEffect(() => {
    if (empleadoId) cargarNominas(empleadoId)
    else setNominas([])
  }, [empleadoId, cargarNominas])

  async function handleProcesar(periodoId: string) {
    setProcesandoId(periodoId)
    try {
      const res = await procesarPeriodoNomina(periodoId)
      toast.success(`Periodo procesado: ${res.nominas_generadas} nominas generadas`)
      await cargarPeriodos()
      if (empleadoId) await cargarNominas(empleadoId)
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "No se pudo procesar el periodo")
    } finally {
      setProcesandoId(null)
    }
  }

  async function handleCerrar(periodoId: string) {
    try {
      await cerrarPeriodoNomina(periodoId)
      toast.success("Periodo cerrado")
      await cargarPeriodos()
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "No se pudo cerrar el periodo")
    }
  }

  return (
    <AppLayout title="Nomina">
      <div className="flex items-center justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-semibold tracking-tight">Nomina</h1>
          <p className="text-sm text-muted-foreground">Periodos de pago y volantes</p>
        </div>
        <CrearPeriodoDialog
          open={createOpen}
          onOpenChange={setCreateOpen}
          onCreated={(nuevo) => {
            setPeriodos((prev) => [nuevo, ...prev])
            toast.success("Periodo creado")
            setCreateOpen(false)
          }}
        />
      </div>

      <section className="flex flex-col gap-2">
        <h2 className="text-sm font-medium text-muted-foreground">Periodos</h2>
        {periodos.length === 0 ? (
          <p className="text-sm text-muted-foreground">Aun no hay periodos registrados.</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {periodos.map((p) => (
              <li key={p.id} className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-border/60 p-3 text-sm">
                <div>
                  <span className="font-medium">
                    {p.fecha_inicio} a {p.fecha_fin}
                  </span>
                  <Badge
                    variant={p.estado === "CERRADO" ? "outline" : p.estado === "PROCESADO" ? "secondary" : "default"}
                    className="ml-2 font-normal"
                  >
                    {p.estado}
                  </Badge>
                </div>
                <div className="flex gap-2">
                  {p.estado === "ABIERTO" && (
                    <Button type="button" size="sm" disabled={procesandoId === p.id} onClick={() => handleProcesar(p.id)}>
                      {procesandoId === p.id ? "Procesando..." : "Procesar"}
                    </Button>
                  )}
                  {p.estado === "PROCESADO" && (
                    <Button type="button" size="sm" variant="outline" onClick={() => handleCerrar(p.id)}>
                      Cerrar
                    </Button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <Separator />

      <div className="flex flex-col gap-2">
        <Label>Empleado</Label>
        <Select value={empleadoId} onValueChange={(v) => setEmpleadoId(v ?? "")}>
          <SelectTrigger className="w-full sm:w-96">
            <SelectValue>
              {(v: string | null) => {
                if (!v) return "Selecciona un empleado para ver sus nominas"
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

      {empleadoSeleccionado && (
        <section className="flex flex-col gap-3">
          <h2 className="text-sm font-medium text-muted-foreground">Nominas de {empleadoSeleccionado.nombres}</h2>
          {loadingNominas ? (
            <p className="text-sm text-muted-foreground">Cargando...</p>
          ) : nominas.length === 0 ? (
            <p className="text-sm text-muted-foreground">Este empleado aun no tiene nominas generadas.</p>
          ) : (
            <ul className="flex flex-col gap-2">
              {nominas.map((n) => (
                <NominaCard key={n.id} nomina={n} />
              ))}
            </ul>
          )}
        </section>
      )}
    </AppLayout>
  )
}

function NominaCard({ nomina }: { nomina: NominaOut }) {
  const [detalle, setDetalle] = useState<NominaDetalleOut | null>(null)
  const [expandido, setExpandido] = useState(false)
  const [descargando, setDescargando] = useState(false)

  async function toggleDetalle() {
    if (!expandido && !detalle) {
      try {
        setDetalle(await obtenerNomina(nomina.id))
      } catch {
        toast.error("No se pudo cargar el detalle de la nomina")
        return
      }
    }
    setExpandido((v) => !v)
  }

  async function handleDescargar() {
    setDescargando(true)
    try {
      await descargarVolante(nomina.id)
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "No se pudo descargar el volante")
    } finally {
      setDescargando(false)
    }
  }

  return (
    <li className="rounded-md border border-border/60 p-3 text-sm">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="font-medium">Salario neto: {nomina.salario_neto.toLocaleString()}</p>
          <p className="text-xs text-muted-foreground">
            Bruto {nomina.salario_bruto.toLocaleString()} - Deducciones {nomina.total_deducciones.toLocaleString()}
          </p>
        </div>
        <div className="flex gap-2">
          <Button type="button" size="sm" variant="ghost" onClick={toggleDetalle}>
            {expandido ? "Ocultar detalle" : "Ver detalle"}
          </Button>
          <Button type="button" size="sm" disabled={descargando} onClick={handleDescargar}>
            {descargando ? "Descargando..." : "Descargar volante"}
          </Button>
        </div>
      </div>
      {expandido && detalle && (
        <ul className="mt-2 flex flex-col gap-1 border-t border-border/60 pt-2">
          {detalle.conceptos.map((c) => (
            <li key={c.id} className="flex justify-between text-xs text-muted-foreground">
              <span>{c.descripcion}</span>
              <span>{c.monto.toLocaleString()}</span>
            </li>
          ))}
        </ul>
      )}
    </li>
  )
}

function CrearPeriodoDialog({
  open,
  onOpenChange,
  onCreated,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  onCreated: (periodo: PeriodoNominaOut) => void
}) {
  const [fechaInicio, setFechaInicio] = useState("")
  const [fechaFin, setFechaFin] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [errores, setErrores] = useState<Record<string, string>>({})

  function resetForm() {
    setFechaInicio("")
    setFechaFin("")
    setError(null)
    setErrores({})
  }

  async function handleSubmit() {
    const nuevosErrores = recolectarErrores({ fechas: validarRangoFechasObligatorio(fechaInicio, fechaFin) })
    setErrores(nuevosErrores)
    if (Object.keys(nuevosErrores).length > 0) return

    setSubmitting(true)
    setError(null)
    try {
      const nuevo = await crearPeriodoNomina({ fecha_inicio: fechaInicio, fecha_fin: fechaFin })
      resetForm()
      onCreated(nuevo)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "No se pudo crear el periodo")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(next) => { if (!next) resetForm(); onOpenChange(next) }}>
      <DialogTrigger render={<Button />}>+ Nuevo periodo</DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Crear periodo de nomina</DialogTitle>
          <DialogDescription>Define el rango de fechas a procesar.</DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-2">
              <Label htmlFor="periodo-inicio">Fecha de inicio</Label>
              <Input id="periodo-inicio" type="date" value={fechaInicio} onChange={(e) => setFechaInicio(e.target.value)} aria-invalid={!!errores.fechas} />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="periodo-fin">Fecha de fin</Label>
              <Input id="periodo-fin" type="date" value={fechaFin} onChange={(e) => setFechaFin(e.target.value)} aria-invalid={!!errores.fechas} />
            </div>
          </div>
          {errores.fechas && <p className="text-xs text-destructive">{errores.fechas}</p>}

          <DialogFooter>
            <Button type="button" disabled={submitting} onClick={handleSubmit}>
              {submitting ? "Creando..." : "Crear periodo"}
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  )
}
