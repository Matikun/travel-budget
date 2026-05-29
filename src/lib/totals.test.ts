import { describe, expect, it } from 'vitest'

import { calculateTotal } from './totals'

describe('calculateTotal', () => {
  it('sums defined prices and skips empty values', () => {
    expect(calculateTotal([100, undefined, 50, null])).toBe(150)
  })

  it('returns zero when all prices are empty', () => {
    expect(calculateTotal([undefined, null])).toBe(0)
  })
})
