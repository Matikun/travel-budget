import { describe, expect, it } from 'vitest'

import { isValidItemPhotoDataUrl } from './item-photo'
import { shouldShowItemPhotoInPdf } from './pdf-helpers'
import { defaultExcursion, defaultFlight, defaultHotel } from './schema'

describe('isValidItemPhotoDataUrl', () => {
  it('accepts a data URL within size limits', () => {
    const dataUrl = `data:image/jpeg;base64,${'a'.repeat(100)}`
    expect(isValidItemPhotoDataUrl(dataUrl)).toBe(true)
  })

  it('rejects empty or non-data URLs', () => {
    expect(isValidItemPhotoDataUrl(undefined)).toBe(false)
    expect(isValidItemPhotoDataUrl('https://example.com/image.jpg')).toBe(false)
  })
})

describe('shouldShowItemPhotoInPdf', () => {
  it('shows photo when data URL exists and toggle is on', () => {
    expect(
      shouldShowItemPhotoInPdf({
        photoDataUrl: 'data:image/jpeg;base64,abc',
        showPhotoInPdf: true,
      }),
    ).toBe(true)
  })

  it('hides photo when toggle is off', () => {
    expect(
      shouldShowItemPhotoInPdf({
        photoDataUrl: 'data:image/jpeg;base64,abc',
        showPhotoInPdf: false,
      }),
    ).toBe(false)
  })

  it('hides photo when no data URL', () => {
    expect(shouldShowItemPhotoInPdf(defaultFlight())).toBe(false)
    expect(shouldShowItemPhotoInPdf(defaultHotel())).toBe(false)
    expect(shouldShowItemPhotoInPdf(defaultExcursion())).toBe(false)
  })
})
