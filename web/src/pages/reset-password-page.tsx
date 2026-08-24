import { useState, type FormEvent } from "react"
import { Link, useSearchParams } from "react-router-dom"
import { Building2, CircleCheck } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { resetPassword, ApiError } from "@/lib/api"

export function ResetPasswordPage() {
  const [searchParams] = useSearchParams()
  const token = searchParams.get("token")

  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [done, setDone] = useState(false)

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setError(null)

    if (password !== confirmPassword) {
      setError("Las contrasenas no coinciden")
      return
    }

    setSubmitting(true)
    try {
      await resetPassword(token!, password)
      setDone(true)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Ocurrio un error inesperado")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="relative flex min-h-svh items-center justify-center overflow-hidden bg-background p-4">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 [background:radial-gradient(60%_50%_at_50%_0%,var(--color-accent)_0%,transparent_100%)] opacity-60"
      />

      <div className="relative flex w-full max-w-sm flex-col items-center gap-6">
        <div className="flex flex-col items-center gap-3 text-center">
          <div className="flex size-11 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
            <Building2 className="size-5" />
          </div>
          <div>
            <h1 className="text-lg font-semibold tracking-tight">Talento360-HR</h1>
            <p className="text-sm text-muted-foreground">Global Retail Solutions, S.A.</p>
          </div>
        </div>

        <Card className="w-full border-border/60 shadow-sm">
          {!token ? (
            <CardContent className="flex flex-col items-center gap-3 pt-6 text-center">
              <CardTitle className="text-base font-medium">Enlace invalido</CardTitle>
              <CardDescription>
                Este enlace de recuperacion no es valido. Solicita uno nuevo para continuar.
              </CardDescription>
              <Button variant="outline" className="mt-2 w-full" render={<Link to="/forgot-password" />}>
                Solicitar nuevo enlace
              </Button>
            </CardContent>
          ) : done ? (
            <CardContent className="flex flex-col items-center gap-3 pt-6 text-center">
              <div className="flex size-11 items-center justify-center rounded-full bg-primary/10 text-primary">
                <CircleCheck className="size-5" />
              </div>
              <CardTitle className="text-base font-medium">Contrasena actualizada</CardTitle>
              <CardDescription>Ya puedes iniciar sesion con tu nueva contrasena.</CardDescription>
              <Button className="mt-2 w-full" render={<Link to="/login" />}>
                Iniciar sesion
              </Button>
            </CardContent>
          ) : (
            <>
              <CardHeader>
                <CardTitle className="text-base font-medium">Elige una nueva contrasena</CardTitle>
                <CardDescription>Debe tener al menos 8 caracteres</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                  {error && (
                    <Alert variant="destructive">
                      <AlertTitle>No se pudo restablecer la contrasena</AlertTitle>
                      <AlertDescription>{error}</AlertDescription>
                    </Alert>
                  )}

                  <div className="flex flex-col gap-2">
                    <Label htmlFor="password">Nueva contrasena</Label>
                    <Input
                      id="password"
                      type="password"
                      autoComplete="new-password"
                      minLength={8}
                      maxLength={72}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                    />
                  </div>

                  <div className="flex flex-col gap-2">
                    <Label htmlFor="confirm-password">Confirmar contrasena</Label>
                    <Input
                      id="confirm-password"
                      type="password"
                      autoComplete="new-password"
                      minLength={8}
                      maxLength={72}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                    />
                  </div>

                  <Button type="submit" className="mt-2 w-full" disabled={submitting}>
                    {submitting ? "Guardando..." : "Restablecer contrasena"}
                  </Button>
                </form>
              </CardContent>
            </>
          )}
        </Card>
      </div>
    </div>
  )
}
