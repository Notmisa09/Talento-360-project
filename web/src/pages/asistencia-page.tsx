import { useCallback, useEffect, useMemo, useState } from "react"
import { toast } from "sonner"
import { AppLayout } from "@/components/app-layout"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  ApiError,
  aprobarSolicitudPermiso,
  crearSolicitudPermiso,
  listarEmpleados,
  listarRegistrosAsistencia,
  listarSolicitudesPermiso,
  marcarEntrada,
  marcarSalida,
  obtenerResumenAsistencia,
  obtenerSaldoVacaciones,
  rechazarSolicitudPermiso,
} from "@/lib/api"
import type {
  EmpleadoOut,
  RegistroAsistenciaOut,
  ResumenAsistenciaOut,
  SaldoVacacionesOut,
  SolicitudPermisoOut,
  TipoPermisoEnum,
} from "@/lib/types"
import { recolectarErrores, validarLongitudMaxima, validarRangoFechasObligatorio, validarSeleccion } from "@/lib/validation"

const TIPOS_PERMISO: { value: TipoPermisoEnum; label: string }[] = [
  { value: "VACACIONES", label: "Vacaciones" },
  { value: "ENFERMEDAD", label: "Enfermedad" },
  { value: "PERSONAL", label: "Personal" },
  { value: "LUTO", label: "Luto" },
  { value: "MATERNIDAD_PATERNIDAD", label: "Maternidad/Paternidad" },
  { value: "OTRO", label: "Otro" },
]

function mesActual(): string {
  const hoy = new Date()
  return `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, "0")}`
}

export function AsistenciaPage() {
  const [empleados, setEmpleados] = useState<EmpleadoOut[]>([])
  const [empleadoId, setEmpleadoId] = useState("")
  const [pendientes, setPendientes] = useState<SolicitudPermisoOut[]>([])
  const [cargandoPendientes, setCargandoPendientes] = useState(false)

  const empleadosMap = useMemo(() => new Map(empleados.map((e) => [e.id, `${e.nombres} ${e.apellidos}`])), [empleados])
  const empleadoSeleccionado = useMemo(() => empleados.find((e) => e.id === empleadoId) ?? null, [empleados, empleadoId])

  const cargarEmpleados = useCallback(async () => {
    try {
      const res = await listarEmpleados(1, 100)
      setEmpleados(res.items)
    } catch {
      toast.error("No se pudieron cargar los empleados")
    }
  }, [])

  const cargarPendientes = useCallback(async () => {
    setCargandoPendientes(true)
    try {
      const res = await listarSolicitudesPermiso({ estado: "PENDIENTE" })
      setPendientes(res)
    } catch {
      toast.error("No se pudieron cargar las solicitudes pendientes")
    } finally {
      setCargandoPendientes(false)
    }
  }, [])

  useEffect(() => {
    cargarEmpleados()
    cargarPendientes()
  }, [cargarEmpleados, cargarPendientes])

  async function resolverSolicitud(solicitudId: string, accion: "aprobar" | "rechazar") {
    try {
      if (accion === "aprobar") {
        await aprobarSolicitudPermiso(solicitudId)
        toast.success("Solicitud aprobada")
      } else {
        await rechazarSolicitudPermiso(solicitudId, null)
        toast.success("Solicitud rechazada")
      }
      setPendientes((prev) => prev.filter((s) => s.id !== solicitudId))
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "No se pudo resolver la solicitud")
    }
  }

  return (
    <AppLayout title="Asistencia y Tiempo">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-tight">Asistencia y Tiempo</h1>
        <p className="text-sm text-muted-foreground">Marcaje, permisos y saldo de vacaciones</p>
      </div>

      <section className="flex flex-col gap-3 rounded-xl border border-border/60 p-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-medium">Solicitudes pendientes de aprobacion</h2>
          <Badge variant="secondary" className="font-normal">
            {pendientes.length}
          </Badge>
        </div>
        {cargandoPendientes ? (
          <p className="text-sm text-muted-foreground">Cargando...</p>
        ) : pendientes.length === 0 ? (
          <p className="text-sm text-muted-foreground">No hay solicitudes pendientes.</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {pendientes.map((s) => (
              <li
                key={s.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-border/60 p-3 text-sm"
              >
                <div>
                  <p className="font-medium">{empleadosMap.get(s.empleado_id) ?? s.empleado_id}</p>
                  <p className="text-xs text-muted-foreground">
                    {TIPOS_PERMISO.find((t) => t.value === s.tipo)?.label ?? s.tipo} - {s.fecha_inicio} a {s.fecha_fin} (
                    {s.dias_solicitados} dias)
                  </p>
                  {s.motivo && <p className="text-xs text-muted-foreground">Motivo: {s.motivo}</p>}
                </div>
                <div className="flex gap-2">
                  <Button type="button" size="sm" onClick={() => resolverSolicitud(s.id, "aprobar")}>
                    Aprobar
                  </Button>
                  <Button type="button" size="sm" variant="outline" onClick={() => resolverSolicitud(s.id, "rechazar")}>
                    Rechazar
                  </Button>
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
                if (!v) return "Selecciona un empleado"
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
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <MarcajeSection empleadoId={empleadoSeleccionado.id} />
          <SaldoYPermisosSection
            empleadoId={empleadoSeleccionado.id}
            onSolicitudCreada={() => cargarPendientes()}
          />
        </div>
      )}
    </AppLayout>
  )
}

function MarcajeSection({ empleadoId }: { empleadoId: string }) {
  const [registros, setRegistros] = useState<RegistroAsistenciaOut[]>([])
  const [loading, setLoading] = useState(false)
  const [marcando, setMarcando] = useState(false)
  const [mes, setMes] = useState(mesActual())
  const [resumen, setResumen] = useState<ResumenAsistenciaOut | null>(null)

  const cargar = useCallback(async () => {
    setLoading(true)
    try {
      const data = await listarRegistrosAsistencia(empleadoId)
      setRegistros(data)
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "No se pudieron cargar los registros")
    } finally {
      setLoading(false)
    }
  }, [empleadoId])

  useEffect(() => {
    cargar()
  }, [cargar])

  useEffect(() => {
    obtenerResumenAsistencia(empleadoId, mes)
      .then(setResumen)
      .catch(() => setResumen(null))
  }, [empleadoId, mes])

  const marcajeAbierto = registros.some((r) => r.hora_salida === null)

  async function handleMarcaje(tipo: "entrada" | "salida") {
    setMarcando(true)
    try {
      if (tipo === "entrada") {
        await marcarEntrada(empleadoId)
        toast.success("Entrada registrada")
      } else {
        await marcarSalida(empleadoId)
        toast.success("Salida registrada")
      }
      await cargar()
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "No se pudo registrar el marcaje")
    } finally {
      setMarcando(false)
    }
  }

  return (
    <section className="flex flex-col gap-3 rounded-xl border border-border/60 p-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium">Marcaje</h3>
        <div className="flex gap-2">
          <Button type="button" size="sm" disabled={marcando || marcajeAbierto} onClick={() => handleMarcaje("entrada")}>
            Marcar entrada
          </Button>
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={marcando || !marcajeAbierto}
            onClick={() => handleMarcaje("salida")}
          >
            Marcar salida
          </Button>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Label htmlFor="mes-resumen" className="text-xs text-muted-foreground">
          Resumen del mes
        </Label>
        <Input
          id="mes-resumen"
          type="month"
          value={mes}
          onChange={(e) => setMes(e.target.value)}
          className="w-40"
        />
      </div>
      {resumen && (
        <p className="text-xs text-muted-foreground">
          {resumen.dias_registrados} dias registrados - {resumen.horas_trabajadas_total}h trabajadas -{" "}
          {resumen.horas_extra_total}h extra
        </p>
      )}

      {loading ? (
        <p className="text-sm text-muted-foreground">Cargando...</p>
      ) : registros.length === 0 ? (
        <p className="text-sm text-muted-foreground">Sin registros de asistencia.</p>
      ) : (
        <ul className="flex flex-col gap-1">
          {registros.slice(0, 10).map((r) => (
            <li key={r.id} className="flex items-center justify-between rounded-md border border-border/60 p-2 text-xs">
              <span>{new Date(r.hora_entrada).toLocaleString()}</span>
              <span>{r.hora_salida ? new Date(r.hora_salida).toLocaleString() : "Abierto"}</span>
              <span className="text-muted-foreground">
                {r.horas_trabajadas != null ? `${r.horas_trabajadas}h` : "-"}
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}

function SaldoYPermisosSection({
  empleadoId,
  onSolicitudCreada,
}: {
  empleadoId: string
  onSolicitudCreada: () => void
}) {
  const [saldo, setSaldo] = useState<SaldoVacacionesOut | null>(null)
  const [solicitudes, setSolicitudes] = useState<SolicitudPermisoOut[]>([])
  const [loading, setLoading] = useState(false)
  const [formOpen, setFormOpen] = useState(false)
  const [tipo, setTipo] = useState<TipoPermisoEnum | "">("")
  const [fechaInicio, setFechaInicio] = useState("")
  const [fechaFin, setFechaFin] = useState("")
  const [motivo, setMotivo] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [errores, setErrores] = useState<Record<string, string>>({})

  const cargar = useCallback(async () => {
    setLoading(true)
    try {
      const [saldoData, solicitudesData] = await Promise.all([
        obtenerSaldoVacaciones(empleadoId),
        listarSolicitudesPermiso({ empleadoId }),
      ])
      setSaldo(saldoData)
      setSolicitudes(solicitudesData)
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "No se pudo cargar la informacion de permisos")
    } finally {
      setLoading(false)
    }
  }, [empleadoId])

  useEffect(() => {
    cargar()
  }, [cargar])

  async function handleCrear() {
    const nuevosErrores = recolectarErrores({
      tipo: validarSeleccion(tipo, "un tipo de permiso"),
      fechas: validarRangoFechasObligatorio(fechaInicio, fechaFin),
      motivo: validarLongitudMaxima(motivo, 1000, "El motivo"),
    })
    setErrores(nuevosErrores)
    if (Object.keys(nuevosErrores).length > 0 || !tipo) return

    setSubmitting(true)
    setError(null)
    try {
      await crearSolicitudPermiso({
        empleado_id: empleadoId,
        tipo,
        fecha_inicio: fechaInicio,
        fecha_fin: fechaFin,
        motivo: motivo.trim() || null,
      })
      toast.success("Solicitud registrada")
      setFormOpen(false)
      setTipo("")
      setFechaInicio("")
      setFechaFin("")
      setMotivo("")
      setErrores({})
      await cargar()
      onSolicitudCreada()
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "No se pudo registrar la solicitud")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <section className="flex flex-col gap-3 rounded-xl border border-border/60 p-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium">Vacaciones y permisos</h3>
        <Button type="button" variant="ghost" size="sm" onClick={() => setFormOpen((v) => !v)}>
          {formOpen ? "Cancelar" : "+ Nueva solicitud"}
        </Button>
      </div>

      {saldo && (
        <p className="text-xs text-muted-foreground">
          Saldo {saldo.anio}: {saldo.dias_disponibles} dias disponibles, {saldo.dias_tomados} tomados
        </p>
      )}

      {formOpen && (
        <div className="flex flex-col gap-2 rounded-md border border-border/60 p-3">
          {error && <p className="text-xs text-destructive">{error}</p>}
          <Select value={tipo} onValueChange={(v) => setTipo((v as TipoPermisoEnum) ?? "")}>
            <SelectTrigger className="w-full" aria-invalid={!!errores.tipo}>
              <SelectValue>{(v: string | null) => TIPOS_PERMISO.find((t) => t.value === v)?.label ?? "Selecciona un tipo"}</SelectValue>
            </SelectTrigger>
            <SelectContent>
              {TIPOS_PERMISO.map((t) => (
                <SelectItem key={t.value} value={t.value}>
                  {t.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errores.tipo && <p className="text-xs text-destructive">{errores.tipo}</p>}

          <div className="grid grid-cols-2 gap-3">
            <Input type="date" value={fechaInicio} onChange={(e) => setFechaInicio(e.target.value)} aria-invalid={!!errores.fechas} />
            <Input type="date" value={fechaFin} onChange={(e) => setFechaFin(e.target.value)} aria-invalid={!!errores.fechas} />
          </div>
          {errores.fechas && <p className="text-xs text-destructive">{errores.fechas}</p>}

          <Input placeholder="Motivo (opcional)" value={motivo} onChange={(e) => setMotivo(e.target.value)} aria-invalid={!!errores.motivo} />
          {errores.motivo && <p className="text-xs text-destructive">{errores.motivo}</p>}

          <Button type="button" size="sm" disabled={submitting} onClick={handleCrear}>
            {submitting ? "Enviando..." : "Enviar solicitud"}
          </Button>
        </div>
      )}

      {loading ? (
        <p className="text-sm text-muted-foreground">Cargando...</p>
      ) : solicitudes.length === 0 ? (
        <p className="text-sm text-muted-foreground">Sin solicitudes registradas.</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {solicitudes.map((s) => (
            <li key={s.id} className="rounded-md border border-border/60 p-2 text-sm">
              <div className="flex items-center justify-between">
                <span>{TIPOS_PERMISO.find((t) => t.value === s.tipo)?.label ?? s.tipo}</span>
                <Badge
                  variant={s.estado === "APROBADA" ? "outline" : s.estado === "RECHAZADA" ? "destructive" : "secondary"}
                  className="font-normal"
                >
                  {s.estado}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground">
                {s.fecha_inicio} a {s.fecha_fin} ({s.dias_solicitados} dias)
              </p>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
