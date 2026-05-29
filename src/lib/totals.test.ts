import { describe, expect, it } from 'vitest'

import { defaultBudgetValues } from './schema'
import {
  type BudgetPricesInput,
  budgetHasAnyPrice,
  calculateBudgetTotal,
  calculateTotal,
  collectBudgetPrices,
} from './totals'

describe('calculateTotal', () => {
  it('sums defined prices and skips empty values', () => {
    expect(calculateTotal([100, undefined, 50, null])).toBe(150)
  })

  it('returns zero when all prices are empty', () => {
    expect(calculateTotal([undefined, null])).toBe(0)
  })

  it('includes explicit zero values', () => {
    expect(calculateTotal([100, 0, undefined])).toBe(100)
  })

  it('handles decimal amounts', () => {
    expect(calculateTotal([10.5, 20.25, undefined])).toBeCloseTo(30.75)
  })
})

describe('calculateBudgetTotal', () => {
  const base = defaultBudgetValues()

  it('returns zero for an empty budget', () => {
    expect(calculateBudgetTotal(base)).toBe(0)
  })

  it('sums prices across flights, hotels, excursions, and transfers', () => {
    const budget: BudgetPricesInput = {
      flights: [{ priceUsd: 200 }],
      hotels: [{ priceUsd: 300 }],
      excursions: [{ priceUsd: 75.5 }],
      transfers: [{ priceUsd: 40 }],
    }
    expect(calculateBudgetTotal(budget)).toBeCloseTo(615.5)
  })

  it('ignores assistance price when assistance is disabled', () => {
    expect(
      calculateBudgetTotal({
        travelAssistance: { enabled: false, priceUsd: 999 },
      }),
    ).toBe(0)
  })

  it('includes assistance price when enabled', () => {
    expect(
      calculateBudgetTotal({
        travelAssistance: { enabled: true, priceUsd: 45 },
      }),
    ).toBe(45)
  })

  it('skips undefined line prices in partial budgets', () => {
    expect(calculateBudgetTotal({ flights: [{ priceUsd: 10 }] })).toBe(10)
  })
})

describe('budgetHasAnyPrice', () => {
  it('is false when no prices are set', () => {
    expect(budgetHasAnyPrice(defaultBudgetValues())).toBe(false)
  })

  it('is true when any section has a defined price', () => {
    expect(budgetHasAnyPrice({ excursions: [{ priceUsd: 0 }] })).toBe(true)
  })

  it('is false when assistance is disabled even if price is set', () => {
    expect(
      budgetHasAnyPrice({
        travelAssistance: {
          enabled: false,
          priceUsd: 50,
        },
      }),
    ).toBe(false)
  })
})

describe('collectBudgetPrices', () => {
  it('collects all defined line prices', () => {
    const prices = collectBudgetPrices({
      flights: [{ priceUsd: 1 }],
      hotels: [{ priceUsd: undefined }],
      excursions: [{ priceUsd: 2 }],
      transfers: [],
      travelAssistance: { enabled: true, priceUsd: 3 },
    })
    expect(prices).toEqual([1, undefined, 2, 3])
  })
})
