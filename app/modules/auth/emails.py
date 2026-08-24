def build_reset_password_email(email: str, reset_url: str, expire_minutes: int) -> tuple[str, str]:
    """Arma el correo de recuperacion de contrasena. Devuelve (html, texto_plano)."""

    text = (
        "Talento360-HR\n\n"
        f"Recibimos una solicitud para restablecer la contrasena de la cuenta {email}.\n\n"
        f"Abre este enlace para elegir una nueva contrasena (valido por {expire_minutes} minutos):\n"
        f"{reset_url}\n\n"
        "Si no solicitaste este cambio, puedes ignorar este correo: tu contrasena actual seguira funcionando."
    )

    html = f"""\
<!doctype html>
<html lang="es">
  <body style="margin:0;padding:0;background-color:#f4ede3;font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4ede3;padding:32px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" width="480" cellpadding="0" cellspacing="0" style="max-width:480px;width:100%;background-color:#fffdfa;border-radius:16px;overflow:hidden;border:1px solid #ecdfd0;">
            <tr>
              <td style="padding:32px 32px 8px 32px;text-align:center;">
                <div style="display:inline-flex;align-items:center;justify-content:center;width:44px;height:44px;border-radius:12px;background-color:#b8552d;color:#ffffff;font-size:20px;font-weight:700;line-height:44px;">T</div>
                <h1 style="margin:16px 0 4px 0;font-size:18px;color:#3a2f26;">Talento360-HR</h1>
                <p style="margin:0;font-size:13px;color:#8a7a68;">Global Retail Solutions, S.A.</p>
              </td>
            </tr>
            <tr>
              <td style="padding:24px 32px 8px 32px;">
                <h2 style="margin:0 0 12px 0;font-size:16px;color:#3a2f26;">Restablecer tu contrasena</h2>
                <p style="margin:0 0 16px 0;font-size:14px;line-height:1.6;color:#5c4d3e;">
                  Recibimos una solicitud para restablecer la contrasena de la cuenta
                  <strong style="color:#3a2f26;">{email}</strong>. Haz clic en el boton para elegir una nueva.
                </p>
              </td>
            </tr>
            <tr>
              <td style="padding:8px 32px 24px 32px;text-align:center;">
                <a href="{reset_url}" style="display:inline-block;background-color:#b8552d;color:#ffffff;text-decoration:none;font-size:14px;font-weight:600;padding:12px 28px;border-radius:10px;">
                  Restablecer contrasena
                </a>
              </td>
            </tr>
            <tr>
              <td style="padding:0 32px 8px 32px;">
                <p style="margin:0 0 8px 0;font-size:12px;line-height:1.6;color:#8a7a68;">
                  Este enlace vence en {expire_minutes} minutos. Si el boton no funciona, copia y pega esta direccion en tu navegador:
                </p>
                <p style="margin:0 0 24px 0;font-size:12px;line-height:1.6;word-break:break-all;color:#b8552d;">
                  {reset_url}
                </p>
                <p style="margin:0;font-size:12px;line-height:1.6;color:#8a7a68;">
                  Si tu no solicitaste este cambio, puedes ignorar este correo: tu contrasena actual seguira funcionando.
                </p>
              </td>
            </tr>
            <tr>
              <td style="padding:20px 32px;border-top:1px solid #ecdfd0;text-align:center;">
                <p style="margin:0;font-size:11px;color:#a99a89;">Sistema interno de gestion de recursos humanos</p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>
"""

    return html, text
