import smtplib
import ssl
from email.message import EmailMessage

from app.core.config import settings


def send_email(to: str, subject: str, html_body: str, text_body: str) -> None:
    """Envia un correo HTML (con alternativa en texto plano) via SMTP.

    Si no hay credenciales SMTP configuradas, imprime el correo en consola
    para poder probar el flujo en desarrollo sin depender de un proveedor real.
    """
    if not settings.SMTP_USER or not settings.SMTP_PASSWORD:
        print(f"[EMAIL] SMTP no configurado - se muestra en consola.\nPara: {to}\nAsunto: {subject}\n\n{text_body}")
        return

    message = EmailMessage()
    message["Subject"] = subject
    message["From"] = settings.SMTP_FROM
    message["To"] = to
    message.set_content(text_body)
    message.add_alternative(html_body, subtype="html")

    context = ssl.create_default_context()
    with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT) as server:
        server.starttls(context=context)
        server.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
        server.send_message(message)
