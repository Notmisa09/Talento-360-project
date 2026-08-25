const SOLO_LETRAS = /^[A-Za-zÀ-ÖØ-öø-ÿ\s'.-]+$/
const CEDULA_PATTERN = /^[0-9A-Za-z-]+$/
const TELEFONO_PATTERN = /^[0-9+()\s-]{7,20}$/

function calcularEdad(desde: Date, hasta: Date): number {
  let edad = hasta.getFullYear() - desde.getFullYear()
  const mes = hasta.getMonth() - desde.getMonth()
  if (mes < 0 || (mes === 0 && hasta.getDate() < desde.getDate())) edad--
  return edad
}

export function validarRequerido(valor: string, campo = "Este campo"): string | null {
  return valor.trim() ? null : `${campo} es requerido`
}

export function validarNombre(valor: string, campo = "Este campo"): string | null {
  const v = valor.trim()
  if (!v) return `${campo} es requerido`
  if (v.length < 2) return `${campo} debe tener al menos 2 caracteres`
  if (v.length > 100) return `${campo} no puede superar 100 caracteres`
  if (!SOLO_LETRAS.test(v)) return `${campo} solo puede contener letras`
  return null
}

export function validarCedula(valor: string): string | null {
  const v = valor.trim()
  if (!v) return "La cedula/DNI es requerida"
  if (v.length < 5) return "La cedula/DNI es demasiado corta"
  if (v.length > 30) return "La cedula/DNI es demasiado larga"
  if (!CEDULA_PATTERN.test(v)) return "La cedula/DNI solo puede contener numeros, letras y guiones"
  return null
}

export function validarTelefono(valor: string): string | null {
  const v = valor.trim()
  if (!v) return null
  if (!TELEFONO_PATTERN.test(v)) return "Ingresa un telefono valido (7-20 digitos)"
  return null
}

export function validarFechaNacimiento(valor: string): string | null {
  if (!valor) return "La fecha de nacimiento es requerida"
  const fecha = new Date(valor)
  if (Number.isNaN(fecha.getTime())) return "Fecha invalida"
  const hoy = new Date()
  if (fecha > hoy) return "La fecha de nacimiento no puede ser futura"
  const edad = calcularEdad(fecha, hoy)
  if (edad < 16) return "El colaborador debe tener al menos 16 anos"
  if (edad > 90) return "Verifica la fecha de nacimiento"
  return null
}

export function validarFechaIngreso(valor: string, fechaNacimiento?: string): string | null {
  if (!valor) return "La fecha de ingreso es requerida"
  const fecha = new Date(valor)
  if (Number.isNaN(fecha.getTime())) return "Fecha invalida"

  if (fechaNacimiento) {
    const nacimiento = new Date(fechaNacimiento)
    if (!Number.isNaN(nacimiento.getTime())) {
      if (fecha < nacimiento) return "La fecha de ingreso no puede ser anterior al nacimiento"
      if (calcularEdad(nacimiento, fecha) < 16) return "A esa fecha de ingreso, el colaborador tendria menos de 16 anos"
    }
  }

  const unAnioFuturo = new Date()
  unAnioFuturo.setFullYear(unAnioFuturo.getFullYear() + 1)
  if (fecha > unAnioFuturo) return "La fecha de ingreso es demasiado lejana"
  return null
}

export function validarRangoFechas(inicio: string, fin: string): string | null {
  if (!inicio || !fin) return null
  if (new Date(fin) < new Date(inicio)) return "La fecha de fin no puede ser anterior al inicio"
  return null
}

export function validarMonto(valor: string, campo = "El monto"): string | null {
  if (!valor.trim()) return `${campo} es requerido`
  const n = Number(valor)
  if (Number.isNaN(n)) return `${campo} debe ser un numero valido`
  if (n <= 0) return `${campo} debe ser mayor a 0`
  if (n > 10_000_000) return `Verifica ${campo.toLowerCase()}, parece demasiado alto`
  return null
}

export function validarLongitudMaxima(valor: string, max: number, campo = "Este campo"): string | null {
  return valor.length > max ? `${campo} no puede superar ${max} caracteres` : null
}

export function validarNoNegativo(valor: string, campo = "El valor"): string | null {
  if (!valor.trim()) return `${campo} es requerido`
  const n = Number(valor)
  if (Number.isNaN(n)) return `${campo} debe ser un numero valido`
  if (n < 0) return `${campo} no puede ser negativo`
  return null
}

export function validarRangoNumerico(valor: string, min: number, max: number, campo = "El valor"): string | null {
  if (!valor.trim()) return `${campo} es requerido`
  const n = Number(valor)
  if (Number.isNaN(n)) return `${campo} debe ser un numero valido`
  if (n < min || n > max) return `${campo} debe estar entre ${min} y ${max}`
  return null
}

export function validarRangoFechasObligatorio(inicio: string, fin: string): string | null {
  if (!inicio) return "La fecha de inicio es requerida"
  if (!fin) return "La fecha de fin es requerida"
  if (new Date(fin) < new Date(inicio)) return "La fecha de fin no puede ser anterior al inicio"
  return null
}

export function validarSeleccion(valor: string, campo = "Este campo"): string | null {
  return valor ? null : `Selecciona ${campo}`
}

const EXTENSIONES_PERMITIDAS = ["pdf", "doc", "docx", "jpg", "jpeg", "png"]
const TAMANO_MAXIMO_MB = 10

export function validarArchivo(archivo: File | null): string | null {
  if (!archivo) return "Selecciona un archivo"
  const extension = archivo.name.split(".").pop()?.toLowerCase() ?? ""
  if (!EXTENSIONES_PERMITIDAS.includes(extension)) {
    return `Formato no permitido. Usa: ${EXTENSIONES_PERMITIDAS.join(", ")}`
  }
  if (archivo.size > TAMANO_MAXIMO_MB * 1024 * 1024) {
    return `El archivo no puede superar ${TAMANO_MAXIMO_MB}MB`
  }
  return null
}

/** Ejecuta un mapa de validadores y devuelve solo las entradas con error. */
export function recolectarErrores(validaciones: Record<string, string | null>): Record<string, string> {
  const errores: Record<string, string> = {}
  for (const [campo, mensaje] of Object.entries(validaciones)) {
    if (mensaje) errores[campo] = mensaje
  }
  return errores
}
