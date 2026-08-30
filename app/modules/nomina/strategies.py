"""Strategy Pattern: calculo de nomina segun el tipo de contrato del empleado.

Las tasas de deduccion (SFS/AFP) son ilustrativas de un regimen tipo Republica
Dominicana/Latinoamerica, con fines academicos - no representan una tabla fiscal
vigente y no deben usarse para nomina real sin validacion legal/contable.
"""

from abc import ABC, abstractmethod
from dataclasses import dataclass
from decimal import ROUND_HALF_UP, Decimal

from app.modules.empleados.models import Contrato, Empleado, TipoContratoEnum
from app.modules.nomina.models import TipoConceptoEnum

HORAS_MENSUALES_ESTANDAR = Decimal("240")  # 8h x 30 dias
FACTOR_HORA_EXTRA = Decimal("1.35")
TASA_SFS = Decimal("0.0304")
TASA_AFP = Decimal("0.0287")


def _redondear(monto: Decimal) -> Decimal:
    return monto.quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)


@dataclass
class ConceptoDraft:
    tipo: TipoConceptoEnum
    descripcion: str
    monto: Decimal


class EstrategiaCalculoNomina(ABC):
    @abstractmethod
    def calcular(self, empleado: Empleado, contrato: Contrato, horas_extra_periodo: Decimal) -> list[ConceptoDraft]:
        """Devuelve la lista de conceptos (devengos y deducciones) para un periodo."""


class EstrategiaAsalariado(EstrategiaCalculoNomina):
    """INDEFINIDO y TEMPORAL: salario fijo + horas extra, con deducciones de ley."""

    def calcular(self, empleado: Empleado, contrato: Contrato, horas_extra_periodo: Decimal) -> list[ConceptoDraft]:
        salario_base = Decimal(str(contrato.salario))
        tarifa_hora = salario_base / HORAS_MENSUALES_ESTANDAR
        monto_horas_extra = _redondear(tarifa_hora * FACTOR_HORA_EXTRA * horas_extra_periodo)

        conceptos = [ConceptoDraft(TipoConceptoEnum.SALARIO_BASE, "Salario base del periodo", _redondear(salario_base))]
        if monto_horas_extra > 0:
            conceptos.append(
                ConceptoDraft(TipoConceptoEnum.HORAS_EXTRA, f"Horas extra ({horas_extra_periodo}h)", monto_horas_extra)
            )

        salario_bruto = salario_base + monto_horas_extra
        conceptos.append(
            ConceptoDraft(TipoConceptoEnum.DEDUCCION_SFS, "Seguro Familiar de Salud (SFS)", -_redondear(salario_bruto * TASA_SFS))
        )
        conceptos.append(
            ConceptoDraft(TipoConceptoEnum.DEDUCCION_AFP, "Fondo de pensiones (AFP)", -_redondear(salario_bruto * TASA_AFP))
        )
        return conceptos


class EstrategiaPorHoras(EstrategiaCalculoNomina):
    """POR_HORAS: se paga estrictamente por horas trabajadas (registradas como horas extra sobre 0)."""

    def calcular(self, empleado: Empleado, contrato: Contrato, horas_extra_periodo: Decimal) -> list[ConceptoDraft]:
        salario_base = Decimal(str(contrato.salario))
        tarifa_hora = salario_base / HORAS_MENSUALES_ESTANDAR
        monto = _redondear(tarifa_hora * horas_extra_periodo) if horas_extra_periodo > 0 else Decimal("0.00")
        return [ConceptoDraft(TipoConceptoEnum.SALARIO_BASE, "Pago por horas trabajadas", monto)]


class EstrategiaPractica(EstrategiaCalculoNomina):
    """PRACTICA: monto fijo, sin deducciones de ley."""

    def calcular(self, empleado: Empleado, contrato: Contrato, horas_extra_periodo: Decimal) -> list[ConceptoDraft]:
        salario_base = Decimal(str(contrato.salario))
        return [ConceptoDraft(TipoConceptoEnum.SALARIO_BASE, "Beca/asignacion de practica", _redondear(salario_base))]


_ESTRATEGIAS: dict[TipoContratoEnum, EstrategiaCalculoNomina] = {
    TipoContratoEnum.INDEFINIDO: EstrategiaAsalariado(),
    TipoContratoEnum.TEMPORAL: EstrategiaAsalariado(),
    TipoContratoEnum.POR_HORAS: EstrategiaPorHoras(),
    TipoContratoEnum.PRACTICA: EstrategiaPractica(),
}


def obtener_estrategia(tipo: TipoContratoEnum) -> EstrategiaCalculoNomina:
    return _ESTRATEGIAS[tipo]
