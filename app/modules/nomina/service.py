from decimal import Decimal
from uuid import UUID

from sqlalchemy.orm import Session

from app.modules.asistencia.repository import RegistroAsistenciaRepository
from app.modules.empleados.exceptions import EmpleadoNoEncontradoError
from app.modules.empleados.models import Contrato, EstadoContratoEnum
from app.modules.empleados.repository import ContratoRepository, EmpleadoRepository
from app.modules.nomina.exceptions import (
    NominaNoEncontradaError,
    PeriodoNoProcesadoError,
    PeriodoNominaNoEncontradoError,
    PeriodoSolapadoError,
    PeriodoYaProcesadoError,
)
from app.modules.nomina.models import BONIFICACIONES, DEDUCCIONES, DEVENGOS, ConceptoNomina, EstadoPeriodoEnum, Nomina, PeriodoNomina
from app.modules.nomina.pdf import VolantePdfFactory
from app.modules.nomina.repository import ConceptoNominaRepository, NominaRepository, PeriodoNominaRepository
from app.modules.nomina.schemas import PeriodoNominaCreate
from app.modules.nomina.strategies import obtener_estrategia


class PeriodoNominaService:
    def __init__(self, db: Session) -> None:
        self.repo = PeriodoNominaRepository(db)

    def crear(self, data: PeriodoNominaCreate) -> PeriodoNomina:
        if self.repo.list_solapados(data.fecha_inicio, data.fecha_fin):
            raise PeriodoSolapadoError()
        return self.repo.create(PeriodoNomina(**data.model_dump()))

    def listar(self) -> list[PeriodoNomina]:
        return self.repo.list()

    def obtener(self, periodo_id: UUID) -> PeriodoNomina:
        periodo = self.repo.get_by_id(periodo_id)
        if periodo is None:
            raise PeriodoNominaNoEncontradoError()
        return periodo

    def cerrar(self, periodo_id: UUID) -> PeriodoNomina:
        periodo = self.obtener(periodo_id)
        if periodo.estado != EstadoPeriodoEnum.PROCESADO:
            raise PeriodoNoProcesadoError()
        periodo.cerrar()
        return self.repo.save(periodo)


class NominaService:
    def __init__(self, db: Session) -> None:
        self.db = db
        self.periodos = PeriodoNominaRepository(db)
        self.nominas = NominaRepository(db)
        self.conceptos = ConceptoNominaRepository(db)
        self.empleados = EmpleadoRepository(db)
        self.contratos = ContratoRepository(db)
        self.registros = RegistroAsistenciaRepository(db)

    def _contrato_vigente(self, empleado_id: UUID, periodo: PeriodoNomina) -> Contrato | None:
        for contrato in self.contratos.list_by_empleado(empleado_id):
            if contrato.estado != EstadoContratoEnum.VIGENTE:
                continue
            if contrato.fecha_inicio > periodo.fecha_fin:
                continue
            if contrato.fecha_fin is not None and contrato.fecha_fin < periodo.fecha_inicio:
                continue
            return contrato
        return None

    def procesar_periodo(self, periodo_id: UUID) -> tuple[PeriodoNomina, int]:
        periodo = PeriodoNominaService(self.db).obtener(periodo_id)
        if periodo.estado != EstadoPeriodoEnum.ABIERTO:
            raise PeriodoYaProcesadoError()

        nominas_generadas = 0
        for empleado in self.empleados.list_activos():
            contrato = self._contrato_vigente(empleado.id, periodo)
            if contrato is None:
                continue

            horas_extra = Decimal(
                str(self.registros.sumar_horas_extra_en_rango(empleado.id, periodo.fecha_inicio, periodo.fecha_fin))
            )
            estrategia = obtener_estrategia(contrato.tipo)
            conceptos_draft = estrategia.calcular(empleado, contrato, horas_extra)

            salario_bruto = sum((d.monto for d in conceptos_draft if d.tipo in DEVENGOS), Decimal("0"))
            total_deducciones = -sum((d.monto for d in conceptos_draft if d.tipo in DEDUCCIONES), Decimal("0"))
            total_bonificaciones = sum((d.monto for d in conceptos_draft if d.tipo in BONIFICACIONES), Decimal("0"))
            salario_neto = salario_bruto + total_bonificaciones - total_deducciones

            nomina = self.nominas.create(
                Nomina(
                    periodo_id=periodo.id,
                    empleado_id=empleado.id,
                    salario_bruto=salario_bruto,
                    total_deducciones=total_deducciones,
                    total_bonificaciones=total_bonificaciones,
                    salario_neto=salario_neto,
                )
            )
            for draft in conceptos_draft:
                self.conceptos.create(
                    ConceptoNomina(nomina_id=nomina.id, tipo=draft.tipo, descripcion=draft.descripcion, monto=draft.monto)
                )
            nominas_generadas += 1

        periodo.procesar()
        periodo = self.periodos.save(periodo)  # commit unico: persiste periodo + todas las nominas/conceptos generados
        return periodo, nominas_generadas

    def listar_por_empleado(self, empleado_id: UUID) -> list[Nomina]:
        if self.empleados.get_by_id(empleado_id) is None:
            raise EmpleadoNoEncontradoError()
        return self.nominas.list_by_empleado(empleado_id)

    def obtener(self, nomina_id: UUID) -> Nomina:
        nomina = self.nominas.get_by_id(nomina_id)
        if nomina is None:
            raise NominaNoEncontradaError()
        return nomina

    def obtener_con_conceptos(self, nomina_id: UUID) -> tuple[Nomina, list[ConceptoNomina]]:
        nomina = self.obtener(nomina_id)
        return nomina, self.conceptos.list_by_nomina(nomina.id)

    def generar_volante_pdf(self, nomina_id: UUID) -> bytes:
        nomina, conceptos = self.obtener_con_conceptos(nomina_id)
        periodo = self.periodos.get_by_id(nomina.periodo_id)
        empleado = self.empleados.get_by_id(nomina.empleado_id)
        return VolantePdfFactory.generar(nomina, periodo, empleado, conceptos)
