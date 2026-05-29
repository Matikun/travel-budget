import { describe, expect, it } from 'vitest'

import { budgetSchema } from './schema'

describe('budgetSchema', () => {
  it('accepts a minimal payload', () => {
    const result = budgetSchema.safeParse({ destination: 'Bariloche' })
    expect(result.success).toBe(true)
  })

  it('rejects missing destination', () => {
    const result = budgetSchema.safeParse({})
    expect(result.success).toBe(false)
  })
})
