import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react"
import { Link } from "react-router-dom"
import { MoreHorizontal, Plus } from "lucide-react"
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
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  ApiError,
  agendarEntrevista,
  cambiarEstadoPostulacion,
  cerrarVacante,
  contratarPostulacion,
  crearCandidato,
  crearVacante,
  listarCandidatos,
  listarDepartamentos,
  listarEntrevistas,
  listarPostulacionesDeVacante,
  listarPuestos,
  listarSucursales,
  listarVacantes,
  postularCandidato,
  publicarVacante,
  rechazarPostulacion,
} from "@/lib/api"
import { useAuth } from "@/hooks/use-auth"
import type {
  CandidatoOut,
  DepartamentoOut,
  EntrevistaOut,
  EstadoPostulacionEnum,
  ModalidadEntrevistaEnum,
  PostulacionOut,
  PuestoOut,
  SucursalOut,
  TipoContratoEnum,
  VacanteOut,
} from "@/lib/types"

const PAGE_SIZE = 10

const ESTADOS_VACANTE: { value: string; label: string }[] = [
  { value: "BORRADOR", label: "Borrador" },
  { value: "PUBLICADA", label: "Publicada" },
  { value: "CERRADA", label: "Cerrada" },
]

const ESTADOS_POSTULACION: { value: EstadoPostulacionEnum; label: string }[] = [
  { value: "RECIBIDA", label: "Recibida" },
  { value: "EN_FILTRO", label: "En filtro" },
  { value: "ENTREVISTA", label: "Entrevista" },
  { value: "OFERTA", label: "Oferta" },
]

const MODALIDADES: { value: ModalidadEntrevistaEnum; label: string }[] = [
  { value: "PRESENCIAL", label: "Presencial" },
  { value: "VIRTUAL", label: "Virtual" },
  { value: "TELEFONICA", label: "Telefonica" },
]

const TIPOS_CONTRATO: { value: TipoContratoEnum; label: string }[] = [
  { value: "INDEFINIDO", label: "Indefinido" },
  { value: "TEMPORAL", label: "Temporal" },
  { value: "POR_HORAS", label: "Por horas" },
  { value: "PRACTICA", label: "Practica" },
]

function estadoVacanteLabel(estado: string) {
  return ESTADOS_VACANTE.find((e) => e.value === estado)?.label ?? estado
}

function estadoPostulacionLabel(estado: EstadoPostulacionEnum) {
  if (estado === "CONTRATADO") return "Contratado"
  if (estado === "RECHAZADA") return "Rechazada"
  return ESTADOS_POSTULACION.find((e) => e.value === estado)?.label ?? estado
}

export function ReclutamientoPage() {
  const [vacantes, setVacantes] = useState<VacanteOut[]>([])
  const [page, setPage] = useState(1)
  const [pages, setPages] = useState(0)
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [busyId, setBusyId] = useState<string | null>(null)

  const [departamentos, setDepartamentos] = useState<DepartamentoOut[]>([])
  const [sucursales, setSucursales] = useState<SucursalOut[]>([])
  const [puestos, setPuestos] = useState<PuestoOut[]>([])

  const [createOpen, setCreateOpen] = useState(false)
  const [postulacionesVacante, setPostulacionesVacante] = useState<VacanteOut | null>(null)

  const departamentosMap = useMemo(() => new Map(departamentos.map((d) => [d.id, d.nombre])), [departamentos])
  const sucursalesMap = useMemo(() => new Map(sucursales.map((s) => [s.id, s.nombre])), [sucursales])

  const cargarCatalogos = useCallback(async () => {
    try {
      const [dep, suc, pue] = await Promise.all([listarDepartamentos(), listarSucursales(), listarPuestos()])
      setDepartamentos(dep)
      setSucursales(suc)
      setPuestos(pue)
    } catch {
      toast.error("No se pudieron cargar los catalogos")
    }
  }, [])

  const cargarVacantes = useCallback(async (targetPage: number) => {
    setLoading(true)
    setError(null)
    try {
      const data = await listarVacantes(targetPage, PAGE_SIZE)
      setVacantes(data.items)
      setTotal(data.total)
      setPages(data.pages)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "No se pudo cargar la lista de vacantes")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    cargarCatalogos()
  }, [cargarCatalogos])

  useEffect(() => {
    cargarVacantes(page)
  }, [cargarVacantes, page])

  async function handlePublicar(vacante: VacanteOut) {
    setBusyId(vacante.id)
    try {
      const actualizada = await publicarVacante(vacante.id)
      setVacantes((prev) => prev.map((v) => (v.id === vacante.id ? actualizada : v)))
      toast.success(`Vacante "${vacante.titulo}" publicada`)
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "No se pudo publicar la vacante")
    } finally {
      setBusyId(null)
    }
  }

  async function handleCerrar(vacante: VacanteOut) {
    setBusyId(vacante.id)
    try {
      const actualizada = await cerrarVacante(vacante.id)
      setVacantes((prev) => prev.map((v) => (v.id === vacante.id ? actualizada : v)))
      toast.success(`Vacante "${vacante.titulo}" cerrada`)
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "No se pudo cerrar la vacante")
    } finally {
      setBusyId(null)
    }
  }

  return (
    <AppLayout title="Reclutamiento">
      <div className="flex items-center justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-semibold tracking-tight">Reclutamiento (ATS)</h1>
          <p className="text-sm text-muted-foreground">
            Vacantes, postulaciones y entrevistas{total > 0 ? ` (${total} vacantes)` : ""}
          </p>
        </div>
        <CrearVacanteDialog
          open={createOpen}
          onOpenChange={setCreateOpen}
          departamentos={departamentos}
          sucursales={sucursales}
          onCreated={(nueva) => {
            toast.success(`Vacante "${nueva.titulo}" creada`)
            setCreateOpen(false)
            if (page === 1) {
              cargarVacantes(1)
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
              <TableHead>Titulo</TableHead>
              <TableHead>Departamento</TableHead>
              <TableHead>Sucursal</TableHead>
              <TableHead>Posiciones</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead className="w-10" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                  Cargando vacantes...
                </TableCell>
              </TableRow>
            ) : vacantes.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                  No hay vacantes registradas
                </TableCell>
              </TableRow>
            ) : (
              vacantes.map((vacante) => {
                const ocupado = busyId === vacante.id
                return (
                  <TableRow key={vacante.id}>
                    <TableCell className="font-medium">{vacante.titulo}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {departamentosMap.get(vacante.departamento_id) ?? "-"}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {sucursalesMap.get(vacante.sucursal_id) ?? "-"}
                    </TableCell>
                    <TableCell className="text-muted-foreground">{vacante.numero_posiciones}</TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          vacante.estado === "PUBLICADA"
                            ? "outline"
                            : vacante.estado === "CERRADA"
                              ? "secondary"
                              : "outline"
                        }
                        className="font-normal"
                      >
                        {estadoVacanteLabel(vacante.estado)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger render={<Button variant="ghost" size="icon-sm" disabled={ocupado} />}>
                          <MoreHorizontal />
                          <span className="sr-only">Acciones</span>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => setPostulacionesVacante(vacante)}>
                            Ver postulaciones
                          </DropdownMenuItem>
                          {vacante.estado === "BORRADOR" && (
                            <DropdownMenuItem onClick={() => handlePublicar(vacante)}>Publicar</DropdownMenuItem>
                          )}
                          {vacante.estado === "PUBLICADA" && (
                            <DropdownMenuItem variant="destructive" onClick={() => handleCerrar(vacante)}>
                              Cerrar vacante
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

      <PostulacionesSheet
        vacante={postulacionesVacante}
        onOpenChange={(open) => {
          if (!open) setPostulacionesVacante(null)
        }}
        puestos={puestos}
      />
    </AppLayout>
  )
}

function CrearVacanteDialog({
  open,
  onOpenChange,
  departamentos,
  sucursales,
  onCreated,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  departamentos: DepartamentoOut[]
  sucursales: SucursalOut[]
  onCreated: (vacante: VacanteOut) => void
}) {
  const [titulo, setTitulo] = useState("")
  const [descripcion, setDescripcion] = useState("")
  const [departamentoId, setDepartamentoId] = useState("")
  const [sucursalId, setSucursalId] = useState("")
  const [posiciones, setPosiciones] = useState("1")
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function resetForm() {
    setTitulo("")
    setDescripcion("")
    setDepartamentoId("")
    setSucursalId("")
    setPosiciones("1")
    setError(null)
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setError(null)
    setSubmitting(true)
    try {
      const nueva = await crearVacante({
        titulo,
        descripcion: descripcion || null,
        departamento_id: departamentoId,
        sucursal_id: sucursalId,
        numero_posiciones: Number(posiciones) || 1,
      })
      resetForm()
      onCreated(nueva)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "No se pudo crear la vacante")
    } finally {
      setSubmitting(false)
    }
  }

  const sinCatalogos = departamentos.length === 0 || sucursales.length === 0

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
        Nueva vacante
      </DialogTrigger>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Crear vacante</DialogTitle>
          <DialogDescription>Publica una nueva posicion para el proceso de reclutamiento.</DialogDescription>
        </DialogHeader>

        {sinCatalogos ? (
          <Alert>
            <AlertTitle>Faltan datos base</AlertTitle>
            <AlertDescription>
              Necesitas al menos una sucursal y un departamento registrados. Puedes crearlos desde{" "}
              <Link to="/empleados" className="underline">
                Empleados
              </Link>
              .
            </AlertDescription>
          </Alert>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {error && (
              <Alert variant="destructive">
                <AlertTitle>No se pudo crear</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="flex flex-col gap-2">
              <Label htmlFor="vac-titulo">Titulo</Label>
              <Input id="vac-titulo" value={titulo} onChange={(e) => setTitulo(e.target.value)} required />
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="vac-descripcion">Descripcion</Label>
              <Input id="vac-descripcion" value={descripcion} onChange={(e) => setDescripcion(e.target.value)} />
            </div>

            <div className="flex flex-col gap-2">
              <Label>Departamento</Label>
              <Select value={departamentoId} onValueChange={(v) => setDepartamentoId(v ?? "")}>
                <SelectTrigger className="w-full">
                  <SelectValue>
                    {(v: string | null) => (v ? (departamentos.find((d) => d.id === v)?.nombre ?? v) : "Selecciona un departamento")}
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
            </div>

            <div className="flex flex-col gap-2">
              <Label>Sucursal</Label>
              <Select value={sucursalId} onValueChange={(v) => setSucursalId(v ?? "")}>
                <SelectTrigger className="w-full">
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
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="vac-posiciones">Numero de posiciones</Label>
              <Input
                id="vac-posiciones"
                type="number"
                min="1"
                value={posiciones}
                onChange={(e) => setPosiciones(e.target.value)}
              />
            </div>

            <DialogFooter>
              <Button type="submit" disabled={submitting || !departamentoId || !sucursalId}>
                {submitting ? "Creando..." : "Crear vacante"}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}

function PostulacionesSheet({
  vacante,
  onOpenChange,
  puestos,
}: {
  vacante: VacanteOut | null
  onOpenChange: (open: boolean) => void
  puestos: PuestoOut[]
}) {
  const [postulaciones, setPostulaciones] = useState<PostulacionOut[]>([])
  const [candidatos, setCandidatos] = useState<CandidatoOut[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const candidatosMap = useMemo(() => new Map(candidatos.map((c) => [c.id, c])), [candidatos])

  const cargar = useCallback(async (vacanteId: string) => {
    setLoading(true)
    setError(null)
    try {
      const [posts, cands] = await Promise.all([listarPostulacionesDeVacante(vacanteId), listarCandidatos(1, 200)])
      setPostulaciones(posts)
      setCandidatos(cands.items)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "No se pudo cargar las postulaciones")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (vacante) {
      cargar(vacante.id)
    } else {
      setPostulaciones([])
    }
  }, [vacante, cargar])

  return (
    <Sheet open={vacante !== null} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-xl">
        <SheetHeader>
          <SheetTitle>Postulaciones</SheetTitle>
          <SheetDescription>{vacante?.titulo}</SheetDescription>
        </SheetHeader>

        <div className="flex flex-col gap-6 px-4 pb-4">
          {error && (
            <Alert variant="destructive">
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {vacante && (
            <PostularCandidatoForm
              vacanteId={vacante.id}
              candidatos={candidatos}
              postulaciones={postulaciones}
              onCandidatoCreado={(c) => setCandidatos((prev) => [c, ...prev])}
              onPostulado={(p) => setPostulaciones((prev) => [p, ...prev])}
            />
          )}

          <Separator />

          {loading ? (
            <p className="text-sm text-muted-foreground">Cargando...</p>
          ) : postulaciones.length === 0 ? (
            <p className="text-sm text-muted-foreground">Aun no hay postulaciones para esta vacante.</p>
          ) : (
            <ul className="flex flex-col gap-3">
              {postulaciones.map((post) => (
                <PostulacionCard
                  key={post.id}
                  postulacion={post}
                  candidato={candidatosMap.get(post.candidato_id)}
                  puestos={puestos}
                  onActualizada={(actualizada) =>
                    setPostulaciones((prev) => prev.map((p) => (p.id === actualizada.id ? actualizada : p)))
                  }
                />
              ))}
            </ul>
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}

function PostularCandidatoForm({
  vacanteId,
  candidatos,
  postulaciones,
  onCandidatoCreado,
  onPostulado,
}: {
  vacanteId: string
  candidatos: CandidatoOut[]
  postulaciones: PostulacionOut[]
  onCandidatoCreado: (c: CandidatoOut) => void
  onPostulado: (p: PostulacionOut) => void
}) {
  const yaPostulados = useMemo(() => new Set(postulaciones.map((p) => p.candidato_id)), [postulaciones])
  const disponibles = candidatos.filter((c) => !yaPostulados.has(c.id))

  const [candidatoId, setCandidatoId] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [nuevoOpen, setNuevoOpen] = useState(false)
  const [nombres, setNombres] = useState("")
  const [apellidos, setApellidos] = useState("")
  const [email, setEmail] = useState("")
  const [telefono, setTelefono] = useState("")
  const [cv, setCv] = useState<File | null>(null)

  async function handlePostularExistente() {
    if (!candidatoId) return
    setSubmitting(true)
    setError(null)
    try {
      const postulacion = await postularCandidato(vacanteId, candidatoId)
      onPostulado(postulacion)
      setCandidatoId("")
      toast.success("Candidato postulado")
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "No se pudo registrar la postulacion")
    } finally {
      setSubmitting(false)
    }
  }

  async function handleCrearYPostular() {
    if (!nombres.trim() || !apellidos.trim() || !email.trim()) return
    setSubmitting(true)
    setError(null)
    try {
      const nuevo = await crearCandidato({ nombres, apellidos, email, telefono: telefono || null, cv })
      onCandidatoCreado(nuevo)
      const postulacion = await postularCandidato(vacanteId, nuevo.id)
      onPostulado(postulacion)
      setNombres("")
      setApellidos("")
      setEmail("")
      setTelefono("")
      setCv(null)
      setNuevoOpen(false)
      toast.success("Candidato registrado y postulado")
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "No se pudo registrar al candidato")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <section className="flex flex-col gap-3">
      <h3 className="text-sm font-medium">Postular candidato</h3>
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {disponibles.length > 0 && (
        <div className="flex gap-2">
          <Select value={candidatoId} onValueChange={(v) => setCandidatoId(v ?? "")}>
            <SelectTrigger className="w-full">
              <SelectValue>
                {(v: string | null) => {
                  if (!v) return "Selecciona un candidato existente"
                  const c = disponibles.find((cand) => cand.id === v)
                  return c ? `${c.nombres} ${c.apellidos}` : v
                }}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {disponibles.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.nombres} {c.apellidos} - {c.email}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button type="button" disabled={!candidatoId || submitting} onClick={handlePostularExistente}>
            Postular
          </Button>
        </div>
      )}

      {!nuevoOpen ? (
        <button
          type="button"
          className="self-start text-xs text-primary hover:underline"
          onClick={() => setNuevoOpen(true)}
        >
          + Registrar candidato nuevo
        </button>
      ) : (
        <div className="flex flex-col gap-2 rounded-md border border-border/60 p-3">
          <div className="grid grid-cols-2 gap-2">
            <Input placeholder="Nombres" value={nombres} onChange={(e) => setNombres(e.target.value)} />
            <Input placeholder="Apellidos" value={apellidos} onChange={(e) => setApellidos(e.target.value)} />
          </div>
          <Input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
          <Input placeholder="Telefono (opcional)" value={telefono} onChange={(e) => setTelefono(e.target.value)} />
          <div className="flex flex-col gap-1">
            <Label className="text-xs">CV (opcional)</Label>
            <input type="file" className="text-sm" onChange={(e) => setCv(e.target.files?.[0] ?? null)} />
          </div>
          <div className="flex gap-2">
            <Button type="button" size="sm" disabled={submitting} onClick={handleCrearYPostular}>
              {submitting ? "Guardando..." : "Registrar y postular"}
            </Button>
            <Button type="button" size="sm" variant="ghost" onClick={() => setNuevoOpen(false)}>
              Cancelar
            </Button>
          </div>
        </div>
      )}
    </section>
  )
}

function PostulacionCard({
  postulacion,
  candidato,
  puestos,
  onActualizada,
}: {
  postulacion: PostulacionOut
  candidato: CandidatoOut | undefined
  puestos: PuestoOut[]
  onActualizada: (p: PostulacionOut) => void
}) {
  const { user } = useAuth()
  const [busy, setBusy] = useState(false)
  const [entrevistasOpen, setEntrevistasOpen] = useState(false)
  const [contratarOpen, setContratarOpen] = useState(false)

  async function handleCambiarEstado(estado: EstadoPostulacionEnum) {
    setBusy(true)
    try {
      const actualizada = await cambiarEstadoPostulacion(postulacion.id, estado)
      onActualizada(actualizada)
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "No se pudo actualizar la postulacion")
    } finally {
      setBusy(false)
    }
  }

  async function handleRechazar() {
    setBusy(true)
    try {
      const actualizada = await rechazarPostulacion(postulacion.id, null)
      onActualizada(actualizada)
      toast.success("Postulacion rechazada")
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "No se pudo rechazar la postulacion")
    } finally {
      setBusy(false)
    }
  }

  const finalizada = postulacion.estado === "CONTRATADO" || postulacion.estado === "RECHAZADA"

  return (
    <li className="rounded-md border border-border/60 p-3">
      <div className="flex items-center justify-between gap-2">
        <div>
          <p className="text-sm font-medium">
            {candidato ? `${candidato.nombres} ${candidato.apellidos}` : "Candidato"}
          </p>
          <p className="text-xs text-muted-foreground">{candidato?.email}</p>
        </div>
        <Badge
          variant={
            postulacion.estado === "CONTRATADO"
              ? "outline"
              : postulacion.estado === "RECHAZADA"
                ? "destructive"
                : "secondary"
          }
          className="font-normal"
        >
          {estadoPostulacionLabel(postulacion.estado)}
        </Badge>
      </div>

      {!finalizada && (
        <div className="mt-2 flex flex-wrap gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger render={<Button variant="outline" size="sm" disabled={busy} />}>
              Cambiar etapa
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              <DropdownMenuRadioGroup
                value={postulacion.estado}
                onValueChange={(v) => handleCambiarEstado(v as EstadoPostulacionEnum)}
              >
                <DropdownMenuLabel>Etapa</DropdownMenuLabel>
                {ESTADOS_POSTULACION.map((e) => (
                  <DropdownMenuRadioItem key={e.value} value={e.value}>
                    {e.label}
                  </DropdownMenuRadioItem>
                ))}
              </DropdownMenuRadioGroup>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setEntrevistasOpen((v) => !v)}>Entrevistas</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setContratarOpen(true)}>Contratar</DropdownMenuItem>
              <DropdownMenuItem variant="destructive" onClick={handleRechazar}>
                Rechazar
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )}

      {entrevistasOpen && (
        <EntrevistasPanel postulacionId={postulacion.id} entrevistadorId={user?.id ?? ""} />
      )}

      <ContratarDialog
        open={contratarOpen}
        onOpenChange={setContratarOpen}
        postulacionId={postulacion.id}
        puestos={puestos}
        onContratado={(estado) => {
          onActualizada({ ...postulacion, estado })
          setContratarOpen(false)
        }}
      />
    </li>
  )
}

function EntrevistasPanel({ postulacionId, entrevistadorId }: { postulacionId: string; entrevistadorId: string }) {
  const [entrevistas, setEntrevistas] = useState<EntrevistaOut[]>([])
  const [loading, setLoading] = useState(true)
  const [formOpen, setFormOpen] = useState(false)
  const [fechaHora, setFechaHora] = useState("")
  const [modalidad, setModalidad] = useState<ModalidadEntrevistaEnum>("VIRTUAL")
  const [comentarios, setComentarios] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    listarEntrevistas(postulacionId)
      .then(setEntrevistas)
      .catch(() => toast.error("No se pudieron cargar las entrevistas"))
      .finally(() => setLoading(false))
  }, [postulacionId])

  async function handleAgendar() {
    if (!fechaHora) return
    setSubmitting(true)
    setError(null)
    try {
      const nueva = await agendarEntrevista(postulacionId, {
        entrevistador_id: entrevistadorId,
        fecha_hora: new Date(fechaHora).toISOString(),
        modalidad,
        comentarios: comentarios || null,
      })
      setEntrevistas((prev) => [...prev, nueva])
      setFormOpen(false)
      setFechaHora("")
      setComentarios("")
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "No se pudo agendar la entrevista")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="mt-3 rounded-md bg-accent/40 p-2">
      {loading ? (
        <p className="text-xs text-muted-foreground">Cargando entrevistas...</p>
      ) : entrevistas.length === 0 ? (
        <p className="text-xs text-muted-foreground">Sin entrevistas agendadas.</p>
      ) : (
        <ul className="flex flex-col gap-1">
          {entrevistas.map((e) => (
            <li key={e.id} className="text-xs">
              {new Date(e.fecha_hora).toLocaleString()} - {MODALIDADES.find((m) => m.value === e.modalidad)?.label}
              {e.calificacion != null ? ` - Calificacion: ${e.calificacion}/5` : ""}
            </li>
          ))}
        </ul>
      )}

      {!formOpen ? (
        <button
          type="button"
          className="mt-2 text-xs text-primary hover:underline"
          onClick={() => setFormOpen(true)}
        >
          + Agendar entrevista
        </button>
      ) : (
        <div className="mt-2 flex flex-col gap-2">
          <Input type="datetime-local" value={fechaHora} onChange={(e) => setFechaHora(e.target.value)} />
          <Select value={modalidad} onValueChange={(v) => setModalidad(v as ModalidadEntrevistaEnum)}>
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {MODALIDADES.map((m) => (
                <SelectItem key={m.value} value={m.value}>
                  {m.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Input
            placeholder="Comentarios (opcional)"
            value={comentarios}
            onChange={(e) => setComentarios(e.target.value)}
          />
          {error && <p className="text-xs text-destructive">{error}</p>}
          <div className="flex gap-2">
            <Button type="button" size="sm" disabled={submitting} onClick={handleAgendar}>
              {submitting ? "Guardando..." : "Guardar"}
            </Button>
            <Button type="button" size="sm" variant="ghost" onClick={() => setFormOpen(false)}>
              Cancelar
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}

function ContratarDialog({
  open,
  onOpenChange,
  postulacionId,
  puestos,
  onContratado,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  postulacionId: string
  puestos: PuestoOut[]
  onContratado: (estado: EstadoPostulacionEnum) => void
}) {
  const [cedula, setCedula] = useState("")
  const [fechaNacimiento, setFechaNacimiento] = useState("")
  const [fechaIngreso, setFechaIngreso] = useState("")
  const [puestoId, setPuestoId] = useState("")
  const [tipoContrato, setTipoContrato] = useState<TipoContratoEnum>("INDEFINIDO")
  const [salario, setSalario] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setError(null)
    setSubmitting(true)
    try {
      const empleado = await contratarPostulacion(postulacionId, {
        cedula_o_dni: cedula,
        fecha_nacimiento: fechaNacimiento,
        fecha_ingreso: fechaIngreso,
        puesto_id: puestoId,
        tipo_contrato: tipoContrato,
        salario: Number(salario),
      })
      toast.success(`Empleado ${empleado.codigo_empleado} creado a partir de la postulacion`)
      onContratado("CONTRATADO")
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "No se pudo completar la contratacion")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Contratar candidato</DialogTitle>
          <DialogDescription>Se creara el expediente de empleado y su primer contrato.</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="flex flex-col gap-2">
            <Label>Cedula / DNI</Label>
            <Input value={cedula} onChange={(e) => setCedula(e.target.value)} required />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-2">
              <Label>Fecha de nacimiento</Label>
              <Input
                type="date"
                value={fechaNacimiento}
                onChange={(e) => setFechaNacimiento(e.target.value)}
                required
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label>Fecha de ingreso</Label>
              <Input type="date" value={fechaIngreso} onChange={(e) => setFechaIngreso(e.target.value)} required />
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <Label>Puesto</Label>
            <Select value={puestoId} onValueChange={(v) => setPuestoId(v ?? "")}>
              <SelectTrigger className="w-full">
                <SelectValue>
                  {(v: string | null) => (v ? (puestos.find((p) => p.id === v)?.titulo ?? v) : "Selecciona un puesto")}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {puestos.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.titulo}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-2">
            <Label>Tipo de contrato</Label>
            <Select value={tipoContrato} onValueChange={(v) => setTipoContrato(v as TipoContratoEnum)}>
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
          </div>

          <div className="flex flex-col gap-2">
            <Label>Salario</Label>
            <Input type="number" min="0" step="0.01" value={salario} onChange={(e) => setSalario(e.target.value)} required />
          </div>

          <DialogFooter>
            <Button type="submit" disabled={submitting || !puestoId}>
              {submitting ? "Contratando..." : "Confirmar contratacion"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
