import { describe, expect, it } from 'vitest'

import { formatUsd } from './format'

describe('formatUsd', () => {
  it('formats numbers as USD', () => {
    expect(formatUsd(1234.5)).toBe('$1,234.50')
  })

  it('formats zero as USD', () => {
    expect(formatUsd(0)).toBe('$0.00')
  })

  it('formats large amounts with grouping', () => {
    expect(formatUsd(1000000)).toBe('$1,000,000.00')
  })

  it('returns empty string for undefined', () => {
    expect(formatUsd(undefined)).toBe('')
  })

  it('returns empty string for null', () => {
    expect(formatUsd(null)).toBe('')
  })
})
