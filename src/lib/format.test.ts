import { describe, expect, it } from 'vitest'

import { formatCarRentalDateTime, formatDate, formatUsd } from './format'

describe('formatUsd', () => {
  it('formats numbers as USD', () => {
    expect(formatUsd(1234.5)).toBe('US$ 1.234,50')
  })

  it('formats zero as USD', () => {
    expect(formatUsd(0)).toBe('US$ 0,00')
  })

  it('formats large amounts with grouping', () => {
    expect(formatUsd(1000000)).toBe('US$ 1.000.000,00')
  })

  it('returns empty string for undefined', () => {
    expect(formatUsd(undefined)).toBe('')
  })

  it('returns empty string for null', () => {
    expect(formatUsd(null)).toBe('')
  })
})

describe('formatDate', () => {
  it('formats dates in Spanish locale', () => {
    expect(formatDate(new Date(2026, 0, 15))).toMatch(/15.*2026/)
  })
})

describe('formatCarRentalDateTime', () => {
  it('combines date and time for PDF copy', () => {
    expect(
      formatCarRentalDateTime(new Date(2026, 5, 11), '10:00'),
    ).toMatch(/11.*2026, 10:00/)
  })

  it('returns only time when date is missing', () => {
    expect(formatCarRentalDateTime(undefined, '10:00')).toBe('10:00')
  })
})
