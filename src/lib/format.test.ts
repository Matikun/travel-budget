import { describe, expect, it } from 'vitest'

import { formatUsd } from './format'

describe('formatUsd', () => {
  it('formats numbers as USD', () => {
    expect(formatUsd(1234.5)).toBe('$1,234.50')
  })

  it('returns empty string for undefined', () => {
    expect(formatUsd(undefined)).toBe('')
  })
})
