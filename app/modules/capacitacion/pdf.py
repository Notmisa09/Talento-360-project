"""Factory Pattern: generacion del certificado (PDF) al completar una inscripcion."""

from io import BytesIO

from reportlab.lib.pagesizes import landscape, letter
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import cm
from reportlab.platypus import Paragraph, SimpleDocTemplate, Spacer

from app.modules.capacitacion.models import Curso, Inscripcion
from app.modules.empleados.models import Empleado


class CertificadoPdfFactory:
    """Genera el certificado de finalizacion de un curso en PDF."""

    @staticmethod
    def generar(inscripcion: Inscripcion, curso: Curso, empleado: Empleado) -> bytes:
        buffer = BytesIO()
        doc = SimpleDocTemplate(buffer, pagesize=landscape(letter), topMargin=3 * cm, bottomMargin=3 * cm)
        styles = getSampleStyleSheet()
        titulo_style = ParagraphStyle("TituloCertificado", parent=styles["Title"], fontSize=28, spaceAfter=20)
        subtitulo_style = ParagraphStyle("Subtitulo", parent=styles["Normal"], fontSize=14, alignment=1)
        nombre_style = ParagraphStyle("Nombre", parent=styles["Title"], fontSize=22, textColor="#1f2937")

        story = [
            Paragraph("Talento360-HR", subtitulo_style),
            Spacer(1, 1 * cm),
            Paragraph("Certificado de Finalizacion", titulo_style),
            Spacer(1, 0.5 * cm),
            Paragraph("Se otorga el presente certificado a:", subtitulo_style),
            Spacer(1, 0.5 * cm),
            Paragraph(f"{empleado.nombres} {empleado.apellidos}", nombre_style),
            Spacer(1, 0.5 * cm),
            Paragraph(f"por haber completado satisfactoriamente el curso <b>{curso.nombre}</b>", subtitulo_style),
            Spacer(1, 0.3 * cm),
            Paragraph(f"({curso.duracion_horas} horas)", subtitulo_style),
            Spacer(1, 1 * cm),
            Paragraph(
                f"Fecha de finalizacion: {inscripcion.fecha_finalizacion.isoformat() if inscripcion.fecha_finalizacion else '-'}",
                subtitulo_style,
            ),
        ]

        doc.build(story)
        return buffer.getvalue()
