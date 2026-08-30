"""Factory Pattern: generacion del volante de pago (PDF) a partir de una Nomina."""

from io import BytesIO

from reportlab.lib import colors
from reportlab.lib.pagesizes import letter
from reportlab.lib.styles import getSampleStyleSheet
from reportlab.lib.units import cm
from reportlab.platypus import Paragraph, SimpleDocTemplate, Spacer, Table, TableStyle

from app.modules.empleados.models import Empleado
from app.modules.nomina.models import ConceptoNomina, Nomina, PeriodoNomina


class VolantePdfFactory:
    """Genera el volante de pago en PDF para una nomina procesada."""

    @staticmethod
    def generar(
        nomina: Nomina, periodo: PeriodoNomina, empleado: Empleado, conceptos: list[ConceptoNomina]
    ) -> bytes:
        buffer = BytesIO()
        doc = SimpleDocTemplate(buffer, pagesize=letter, topMargin=2 * cm, bottomMargin=2 * cm)
        styles = getSampleStyleSheet()
        story = []

        story.append(Paragraph("Talento360-HR", styles["Title"]))
        story.append(Paragraph("Volante de Pago", styles["Heading2"]))
        story.append(Spacer(1, 0.5 * cm))

        datos_empleado = [
            ["Empleado:", f"{empleado.nombres} {empleado.apellidos}"],
            ["Codigo:", empleado.codigo_empleado],
            ["Cedula/DNI:", empleado.cedula_o_dni],
            ["Periodo:", f"{periodo.fecha_inicio.isoformat()} a {periodo.fecha_fin.isoformat()}"],
        ]
        tabla_datos = Table(datos_empleado, colWidths=[4 * cm, 10 * cm])
        tabla_datos.setStyle(
            TableStyle(
                [
                    ("FONTNAME", (0, 0), (0, -1), "Helvetica-Bold"),
                    ("FONTSIZE", (0, 0), (-1, -1), 10),
                    ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
                ]
            )
        )
        story.append(tabla_datos)
        story.append(Spacer(1, 0.7 * cm))

        filas = [["Concepto", "Descripcion", "Monto"]]
        for c in conceptos:
            filas.append([c.tipo.value.replace("_", " ").title(), c.descripcion, f"{float(c.monto):,.2f}"])

        tabla_conceptos = Table(filas, colWidths=[4 * cm, 7 * cm, 3 * cm])
        tabla_conceptos.setStyle(
            TableStyle(
                [
                    ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#1f2937")),
                    ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
                    ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
                    ("FONTSIZE", (0, 0), (-1, -1), 9),
                    ("ALIGN", (2, 0), (2, -1), "RIGHT"),
                    ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#d1d5db")),
                    ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, colors.HexColor("#f9fafb")]),
                ]
            )
        )
        story.append(tabla_conceptos)
        story.append(Spacer(1, 0.7 * cm))

        resumen = [
            ["Salario bruto:", f"{float(nomina.salario_bruto):,.2f}"],
            ["Total deducciones:", f"{float(nomina.total_deducciones):,.2f}"],
            ["Total bonificaciones:", f"{float(nomina.total_bonificaciones):,.2f}"],
            ["Salario neto:", f"{float(nomina.salario_neto):,.2f}"],
        ]
        tabla_resumen = Table(resumen, colWidths=[10 * cm, 4 * cm])
        tabla_resumen.setStyle(
            TableStyle(
                [
                    ("FONTNAME", (0, 0), (-1, -1), "Helvetica"),
                    ("FONTNAME", (0, -1), (-1, -1), "Helvetica-Bold"),
                    ("FONTSIZE", (0, 0), (-1, -1), 10),
                    ("ALIGN", (1, 0), (1, -1), "RIGHT"),
                    ("LINEABOVE", (0, -1), (-1, -1), 0.75, colors.black),
                ]
            )
        )
        story.append(tabla_resumen)

        doc.build(story)
        return buffer.getvalue()
