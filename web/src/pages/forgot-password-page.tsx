import { useState, type FormEvent } from "react"
import { Link } from "react-router-dom"
import { Building2, MailCheck } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { forgotPassword, ApiError } from "@/lib/api"

export function ForgotPasswordPage() {
  const [email, setEmail] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [sent, setSent] = useState(false)

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setError(null)
    setSubmitting(true)
    try {
      await forgotPassword(email)
      setSent(true)
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
          {sent ? (
            <CardContent className="flex flex-col items-center gap-3 pt-6 text-center">
              <div className="flex size-11 items-center justify-center rounded-full bg-primary/10 text-primary">
                <MailCheck className="size-5" />
              </div>
              <CardTitle className="text-base font-medium">Revisa tu correo</CardTitle>
              <CardDescription>
                Si <span className="font-medium text-foreground">{email}</span> esta registrado,
                te enviamos un enlace para restablecer tu contrasena. Puede tardar unos minutos en
                llegar.
              </CardDescription>
              <Button variant="outline" className="mt-2 w-full" render={<Link to="/login" />}>
                Volver a iniciar sesion
              </Button>
            </CardContent>
          ) : (
            <>
              <CardHeader>
                <CardTitle className="text-base font-medium">Olvidaste tu contrasena</CardTitle>
                <CardDescription>
                  Ingresa tu correo y te enviaremos un enlace para restablecerla
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                  {error && (
                    <Alert variant="destructive">
                      <AlertTitle>No se pudo enviar el correo</AlertTitle>
                      <AlertDescription>{error}</AlertDescription>
                    </Alert>
                  )}

                  <div className="flex flex-col gap-2">
                    <Label htmlFor="email">Correo electronico</Label>
                    <Input
                      id="email"
                      type="email"
                      autoComplete="username"
                      placeholder="admin@talento360.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>

                  <Button type="submit" className="mt-2 w-full" disabled={submitting}>
                    {submitting ? "Enviando..." : "Enviar enlace de recuperacion"}
                  </Button>

                  <Link
                    to="/login"
                    className="text-center text-sm text-muted-foreground hover:text-foreground"
                  >
                    Volver a iniciar sesion
                  </Link>
                </form>
              </CardContent>
            </>
          )}
        </Card>
      </div>
    </div>
  )
}
