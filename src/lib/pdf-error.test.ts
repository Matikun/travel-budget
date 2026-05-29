import { describe, expect, it } from 'vitest'

import { formatPdfError } from './pdf-error'

describe('formatPdfError', () => {
  it('detects CSP / WASM errors', () => {
    const info = formatPdfError(
      new Error(
        "Refused to compile WebAssembly module because 'unsafe-eval' is not allowed",
      ),
    )
    expect(info.title).toMatch(/bloqueó/i)
    expect(info.hint).toMatch(/Chrome/i)
  })

  it('returns generic message for unknown errors', () => {
    const info = formatPdfError(new Error('Font load failed'))
    expect(info.title).toMatch(/No se pudo generar/)
  })
})
