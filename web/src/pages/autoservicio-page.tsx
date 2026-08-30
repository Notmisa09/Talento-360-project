import { useCallback, useEffect, useState } from "react"
import { toast } from "sonner"
import { AppLayout } from "@/components/app-layout"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Separator } from "@/components/ui/separator"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  ApiError,
  descargarMiVolante,
  miPerfil,
  miSaldoVacaciones,
  misCursos,
  misEvaluaciones,
  misPermisos,
  misVolantesPago,
  solicitarMiPermiso,
} from "@/lib/api"
import type {
  EmpleadoOut,
  EvaluacionOut,
  InscripcionOut,
  NominaOut,
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

export function AutoservicioPage() {
  const [perfil, setPerfil] = useState<EmpleadoOut | null>(null)
  const [sinVinculo, setSinVinculo] = useState(false)
  const [cargando, setCargando] = useState(true)

  const [volantes, setVolantes] = useState<NominaOut[]>([])
  const [permisos, setPermisos] = useState<SolicitudPermisoOut[]>([])
  const [saldo, setSaldo] = useState<SaldoVacacionesOut | null>(null)
  const [cursos, setCursos] = useState<InscripcionOut[]>([])
  const [evaluaciones, setEvaluaciones] = useState<EvaluacionOut[]>([])

  const cargarTodo = useCallback(async () => {
    setCargando(true)
    try {
      const perfilData = await miPerfil()
      setPerfil(perfilData)
      setSinVinculo(false)
      const [v, p, s, c, e] = await Promise.all([misVolantesPago(), misPermisos(), miSaldoVacaciones(), misCursos(), misEvaluaciones()])
      setVolantes(v)
      setPermisos(p)
      setSaldo(s)
      setCursos(c)
      setEvaluaciones(e)
    } catch (err) {
      if (err instanceof ApiError && err.code === "EMPLEADO_NO_VINCULADO") {
        setSinVinculo(true)
      } else {
        toast.error(err instanceof ApiError ? err.message : "No se pudo cargar tu informacion")
      }
    } finally {
      setCargando(false)
    }
  }, [])

  useEffect(() => {
    cargarTodo()
  }, [cargarTodo])

  if (cargando) {
    return (
      <AppLayout title="Autoservicio">
        <p className="text-sm text-muted-foreground">Cargando...</p>
      </AppLayout>
    )
  }

  if (sinVinculo) {
    return (
      <AppLayout title="Autoservicio">
        <Alert>
          <AlertTitle>Sin expediente vinculado</AlertTitle>
          <AlertDescription>
            Tu cuenta de usuario no esta vinculada a un expediente de empleado, por lo que no hay informacion de
            autoservicio disponible. Contacta a Recursos Humanos si crees que esto es un error.
          </AlertDescription>
        </Alert>
      </AppLayout>
    )
  }

  return (
    <AppLayout title="Autoservicio">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-tight">Mi espacio</h1>
        <p className="text-sm text-muted-foreground">Autoservicio del colaborador</p>
      </div>

      {perfil && (
        <section className="rounded-xl border border-border/60 p-4">
          <h2 className="text-sm font-medium">Mi perfil</h2>
          <p className="mt-1 text-sm">
            {perfil.nombres} {perfil.apellidos} - {perfil.codigo_empleado}
          </p>
          <p className="text-xs text-muted-foreground">Ingreso: {perfil.fecha_ingreso}</p>
        </section>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <VolantesSection volantes={volantes} />
        <PermisosSection saldo={saldo} permisos={permisos} onSolicitudCreada={cargarTodo} />
        <CursosSection cursos={cursos} />
        <EvaluacionesSection evaluaciones={evaluaciones} />
      </div>
    </AppLayout>
  )
}

function VolantesSection({ volantes }: { volantes: NominaOut[] }) {
  const [descargandoId, setDescargandoId] = useState<string | null>(null)

  async function handleDescargar(nominaId: string) {
    setDescargandoId(nominaId)
    try {
      await descargarMiVolante(nominaId)
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "No se pudo descargar el volante")
    } finally {
      setDescargandoId(null)
    }
  }

  return (
    <section className="flex flex-col gap-3 rounded-xl border border-border/60 p-4">
      <h3 className="text-sm font-medium">Mis volantes de pago</h3>
      {volantes.length === 0 ? (
        <p className="text-sm text-muted-foreground">Aun no tienes volantes de pago disponibles.</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {volantes.map((n) => (
            <li key={n.id} className="flex items-center justify-between rounded-md border border-border/60 p-2 text-sm">
              <span>Neto: {n.salario_neto.toLocaleString()}</span>
              <Button type="button" size="sm" disabled={descargandoId === n.id} onClick={() => handleDescargar(n.id)}>
                {descargandoId === n.id ? "Descargando..." : "Descargar"}
              </Button>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}

function PermisosSection({
  saldo,
  permisos,
  onSolicitudCreada,
}: {
  saldo: SaldoVacacionesOut | null
  permisos: SolicitudPermisoOut[]
  onSolicitudCreada: () => void
}) {
  const [formOpen, setFormOpen] = useState(false)
  const [tipo, setTipo] = useState<TipoPermisoEnum | "">("")
  const [fechaInicio, setFechaInicio] = useState("")
  const [fechaFin, setFechaFin] = useState("")
  const [motivo, setMotivo] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [errores, setErrores] = useState<Record<string, string>>({})

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
      await solicitarMiPermiso({ tipo, fecha_inicio: fechaInicio, fecha_fin: fechaFin, motivo: motivo.trim() || null })
      toast.success("Solicitud enviada")
      setFormOpen(false)
      setTipo("")
      setFechaInicio("")
      setFechaFin("")
      setMotivo("")
      setErrores({})
      onSolicitudCreada()
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "No se pudo enviar la solicitud")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <section className="flex flex-col gap-3 rounded-xl border border-border/60 p-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium">Vacaciones y permisos</h3>
        <Button type="button" variant="ghost" size="sm" onClick={() => setFormOpen((v) => !v)}>
          {formOpen ? "Cancelar" : "+ Solicitar"}
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

      <Separator />

      {permisos.length === 0 ? (
        <p className="text-sm text-muted-foreground">Sin solicitudes registradas.</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {permisos.map((p) => (
            <li key={p.id} className="rounded-md border border-border/60 p-2 text-sm">
              <div className="flex items-center justify-between">
                <span>{TIPOS_PERMISO.find((t) => t.value === p.tipo)?.label ?? p.tipo}</span>
                <Badge
                  variant={p.estado === "APROBADA" ? "outline" : p.estado === "RECHAZADA" ? "destructive" : "secondary"}
                  className="font-normal"
                >
                  {p.estado}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground">
                {p.fecha_inicio} a {p.fecha_fin} ({p.dias_solicitados} dias)
              </p>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}

function CursosSection({ cursos }: { cursos: InscripcionOut[] }) {
  return (
    <section className="flex flex-col gap-3 rounded-xl border border-border/60 p-4">
      <h3 className="text-sm font-medium">Mis cursos</h3>
      {cursos.length === 0 ? (
        <p className="text-sm text-muted-foreground">No estas inscrito en ningun curso.</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {cursos.map((c) => (
            <li key={c.id} className="rounded-md border border-border/60 p-2 text-sm">
              <div className="flex items-center justify-between">
                <span>{c.progreso}%</span>
                <Badge variant={c.estado === "COMPLETADO" ? "outline" : "secondary"} className="font-normal">
                  {c.estado}
                </Badge>
              </div>
              <div className="mt-1 h-2 w-full overflow-hidden rounded-full bg-accent">
                <div className="h-full bg-primary" style={{ width: `${Math.min(100, Math.max(0, c.progreso))}%` }} />
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}

function EvaluacionesSection({ evaluaciones }: { evaluaciones: EvaluacionOut[] }) {
  return (
    <section className="flex flex-col gap-3 rounded-xl border border-border/60 p-4">
      <h3 className="text-sm font-medium">Mis evaluaciones</h3>
      {evaluaciones.length === 0 ? (
        <p className="text-sm text-muted-foreground">Aun no tienes evaluaciones registradas.</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {evaluaciones.map((e) => (
            <li key={e.id} className="rounded-md border border-border/60 p-2 text-sm">
              <Badge variant={e.calificacion_final >= 70 ? "outline" : "destructive"} className="font-normal">
                {e.calificacion_final.toFixed(1)} / 100
              </Badge>
              {e.comentarios && <p className="mt-1 text-muted-foreground">{e.comentarios}</p>}
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
