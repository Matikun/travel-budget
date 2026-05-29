export type PdfErrorInfo = {
  title: string
  detail?: string
  hint?: string
}

function isCspError(message: string): boolean {
  const lower = message.toLowerCase()
  return (
    lower.includes('content security policy') ||
    lower.includes('unsafe-eval') ||
    lower.includes('webassembly') ||
    lower.includes('refused to compile') ||
    lower.includes('refused to evaluate')
  )
}

/** User-facing PDF error with optional dev detail and hints. */
export function formatPdfError(error: unknown): PdfErrorInfo {
  const message =
    error instanceof Error
      ? error.message
      : typeof error === 'string'
        ? error
        : 'Error desconocido'

  const stack = error instanceof Error ? error.stack : undefined

  if (isCspError(message) || (stack && isCspError(stack))) {
    return {
      title: 'El navegador bloqueó la generación del PDF (CSP / WebAssembly).',
      detail: import.meta.env.DEV ? message : undefined,
      hint: 'Abrí la app en Chrome o Edge (http://localhost:5173). El preview embebido de algunos IDEs aplica CSP más estricta y bloquea react-pdf.',
    }
  }

  return {
    title: 'No se pudo generar el PDF.',
    detail: import.meta.env.DEV ? message : undefined,
    hint: import.meta.env.DEV
      ? 'Revisá la consola del navegador (F12) para el stack trace completo.'
      : 'Verifique los datos e intente nuevamente.',
  }
}

/** Logs full error in dev for debugging. */
export function logPdfError(error: unknown, budget?: unknown): void {
  if (!import.meta.env.DEV) {
    return
  }

  console.group('[travel-budget] PDF generation failed')
  console.error(error)
  if (budget) {
    console.info('Budget payload:', budget)
  }
  console.groupEnd()
}
