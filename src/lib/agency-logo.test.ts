import { beforeEach, describe, expect, it, vi } from 'vitest'

import {
  AGENCY_LOGO_ERRORS,
  AGENCY_LOGO_STORAGE_KEY,
  MAX_STORED_DATA_URL_LENGTH,
  clearStoredAgencyLogo,
  processLogoFile,
  readStoredAgencyLogo,
  resolveFileMimeType,
  writeStoredAgencyLogo,
  type AgencyLogo,
} from './agency-logo'

const sampleLogo: AgencyLogo = {
  dataUrl: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z9DwHwAFgwJ/lj3/qQAAAABJRU5ErkJggg==',
  mimeType: 'image/png',
  updatedAt: '2026-05-29T12:00:00.000Z',
}

describe('agency logo storage', () => {
  const storage = new Map<string, string>()

  const mockStorage: Storage = {
    get length() {
      return storage.size
    },
    clear() {
      storage.clear()
    },
    getItem(key: string) {
      return storage.get(key) ?? null
    },
    key(index: number) {
      return [...storage.keys()][index] ?? null
    },
    removeItem(key: string) {
      storage.delete(key)
    },
    setItem(key: string, value: string) {
      storage.set(key, value)
    },
  }

  beforeEach(() => {
    storage.clear()
  })

  it('round-trips write and read', () => {
    writeStoredAgencyLogo(sampleLogo, mockStorage)
    expect(readStoredAgencyLogo(mockStorage)).toEqual(sampleLogo)
    expect(storage.has(AGENCY_LOGO_STORAGE_KEY)).toBe(true)
  })

  it('returns null for invalid JSON', () => {
    storage.set(AGENCY_LOGO_STORAGE_KEY, '{not json')
    expect(readStoredAgencyLogo(mockStorage)).toBeNull()
  })

  it('returns null for malformed envelope', () => {
    storage.set(
      AGENCY_LOGO_STORAGE_KEY,
      JSON.stringify({ dataUrl: 'not-a-data-url', mimeType: 'image/gif' }),
    )
    expect(readStoredAgencyLogo(mockStorage)).toBeNull()
  })

  it('clearStoredAgencyLogo removes stored logo', () => {
    writeStoredAgencyLogo(sampleLogo, mockStorage)
    clearStoredAgencyLogo(mockStorage)
    expect(readStoredAgencyLogo(mockStorage)).toBeNull()
  })

  it('returns null when stored data URL exceeds max length', () => {
    storage.set(
      AGENCY_LOGO_STORAGE_KEY,
      JSON.stringify({
        ...sampleLogo,
        dataUrl: `data:image/png;base64,${'a'.repeat(MAX_STORED_DATA_URL_LENGTH)}`,
      }),
    )
    expect(readStoredAgencyLogo(mockStorage)).toBeNull()
  })
})

describe('resolveFileMimeType', () => {
  it('infers JPEG from extension when file.type is empty', () => {
    const file = new File([], 'logo.jpg', { type: '' })
    expect(resolveFileMimeType(file)).toBe('image/jpeg')
  })

  it('returns null for unsupported extensions', () => {
    const file = new File([], 'logo.gif', { type: '' })
    expect(resolveFileMimeType(file)).toBeNull()
  })
})

describe('processLogoFile', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it('rejects non-image MIME types', async () => {
    const file = new File(['hello'], 'doc.pdf', { type: 'application/pdf' })

    await expect(processLogoFile(file)).rejects.toThrow(
      AGENCY_LOGO_ERRORS.wrongMime,
    )
  })

  it('rejects files larger than 2 MB', async () => {
    const file = new File(
      [new Uint8Array(2 * 1024 * 1024 + 1)],
      'logo.png',
      { type: 'image/png' },
    )

    await expect(processLogoFile(file)).rejects.toThrow(
      AGENCY_LOGO_ERRORS.fileTooLarge,
    )
  })

  it('accepts JPG when file.type is empty but extension is .jpg', async () => {
    const pngBytes = Uint8Array.from(
      atob(
        'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z9DwHwAFgwJ/lj3/qQAAAABJRU5ErkJggg==',
      ),
      (char) => char.charCodeAt(0),
    )
    const file = new File([pngBytes], 'logo.jpg', { type: '' })

    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue({
      drawImage: vi.fn(),
      getImageData: vi.fn(() => ({
        data: new Uint8ClampedArray([0, 0, 0, 255]),
      })),
    } as unknown as CanvasRenderingContext2D)

    vi.spyOn(HTMLCanvasElement.prototype, 'toDataURL').mockReturnValue(
      sampleLogo.dataUrl,
    )

    class MockImage {
      width = 32
      height = 32
      onload: (() => void) | null = null
      onerror: (() => void) | null = null

      set src(_value: string) {
        queueMicrotask(() => this.onload?.())
      }
    }

    vi.stubGlobal('Image', MockImage)

    await expect(processLogoFile(file)).resolves.toMatchObject({
      mimeType: 'image/jpeg',
    })
  })

  it('rejects output still too large after resize', async () => {
    const pngBytes = Uint8Array.from(
      atob(
        'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z9DwHwAFgwJ/lj3/qQAAAABJRU5ErkJggg==',
      ),
      (char) => char.charCodeAt(0),
    )
    const file = new File([pngBytes], 'logo.png', { type: 'image/png' })

    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue({
      drawImage: vi.fn(),
      getImageData: vi.fn(() => ({
        data: new Uint8ClampedArray([0, 0, 0, 255]),
      })),
    } as unknown as CanvasRenderingContext2D)

    vi.spyOn(HTMLCanvasElement.prototype, 'toDataURL').mockReturnValue(
      `data:image/png;base64,${'x'.repeat(MAX_STORED_DATA_URL_LENGTH + 1)}`,
    )

    class MockImage {
      width = 32
      height = 32
      onload: (() => void) | null = null
      onerror: (() => void) | null = null

      set src(_value: string) {
        queueMicrotask(() => this.onload?.())
      }
    }

    vi.stubGlobal('Image', MockImage)

    await expect(processLogoFile(file)).rejects.toThrow(
      AGENCY_LOGO_ERRORS.stillTooLarge,
    )
  })

  it('accepts a small PNG fixture after resize', async () => {
    const pngBytes = Uint8Array.from(
      atob(
        'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z9DwHwAFgwJ/lj3/qQAAAABJRU5ErkJggg==',
      ),
      (char) => char.charCodeAt(0),
    )
    const file = new File([pngBytes], 'logo.png', { type: 'image/png' })

    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue({
      drawImage: vi.fn(),
      getImageData: vi.fn(() => ({
        data: new Uint8ClampedArray([0, 0, 0, 255]),
      })),
    } as unknown as CanvasRenderingContext2D)

    vi.spyOn(HTMLCanvasElement.prototype, 'toDataURL').mockReturnValue(
      sampleLogo.dataUrl,
    )

    class MockImage {
      width = 32
      height = 32
      onload: (() => void) | null = null
      onerror: (() => void) | null = null

      set src(_value: string) {
        queueMicrotask(() => this.onload?.())
      }
    }

    vi.stubGlobal('Image', MockImage)

    const result = await processLogoFile(file)

    expect(result.mimeType).toBe('image/jpeg')
    expect(result.dataUrl).toBe(sampleLogo.dataUrl)
    expect(typeof result.updatedAt).toBe('string')
  })
})
