import { describe, expect, it } from 'vitest'

import {
  budgetSchema,
  defaultBudgetValues,
  defaultFlight,
  defaultHotel,
} from './schema'

const baseHeader = {
  destination: 'Bariloche',
  dateFrom: new Date('2026-06-01'),
  dateTo: new Date('2026-06-10'),
  passengers: 2,
}

describe('budgetSchema', () => {
  it('accepts header only with empty flights and hotels', () => {
    const result = budgetSchema.safeParse({
      ...baseHeader,
      flights: [],
      hotels: [],
    })
    expect(result.success).toBe(true)
  })

  it('rejects missing destination', () => {
    const result = budgetSchema.safeParse({
      ...baseHeader,
      destination: '',
      flights: [],
      hotels: [],
    })
    expect(result.success).toBe(false)
  })

  it('rejects when dateFrom is after dateTo', () => {
    const result = budgetSchema.safeParse({
      ...baseHeader,
      dateFrom: new Date('2026-06-15'),
      dateTo: new Date('2026-06-01'),
      flights: [],
      hotels: [],
    })
    expect(result.success).toBe(false)
    if (!result.success) {
      const paths = result.error.issues.map((issue) => issue.path.join('.'))
      expect(paths).toContain('dateTo')
    }
  })

  it('rejects passengers below 1', () => {
    const result = budgetSchema.safeParse({
      ...baseHeader,
      passengers: 0,
      flights: [],
      hotels: [],
    })
    expect(result.success).toBe(false)
  })

  it('rejects passengers above 99', () => {
    const result = budgetSchema.safeParse({
      ...baseHeader,
      passengers: 100,
      flights: [],
      hotels: [],
    })
    expect(result.success).toBe(false)
  })

  it('accepts multiple flights and hotels', () => {
    const result = budgetSchema.safeParse({
      ...baseHeader,
      flights: [
        {
          route: 'EZE → BRC',
          duration: '2h 15m',
          description: 'Directo',
          type: 'direct',
          layovers: [],
          priceUsd: 350,
        },
        {
          route: 'BRC → EZE',
          duration: '5h',
          type: 'layovers',
          layovers: [{ where: 'AEP', duration: '1h' }],
          priceUsd: undefined,
        },
      ],
      hotels: [
        {
          name: 'Hotel Patagonia',
          nights: 5,
          roomType: 'double',
          breakfast: true,
          allInclusive: false,
          priceUsd: 800,
        },
        {
          name: 'Hostería del Lago',
          dateFrom: new Date('2026-06-01'),
          dateTo: new Date('2026-06-04'),
          roomType: 'standard',
          breakfast: false,
          allInclusive: true,
        },
        {
          name: 'Suite Andina',
          dateFrom: new Date('2026-06-04'),
          dateTo: new Date('2026-06-10'),
          roomType: 'luxury',
          breakfast: true,
          allInclusive: false,
          priceUsd: 0,
        },
      ],
    })
    expect(result.success).toBe(true)
  })

  it('rejects layover flight without layover rows', () => {
    const result = budgetSchema.safeParse({
      ...baseHeader,
      flights: [
        {
          route: 'EZE → MAD',
          duration: '12h',
          type: 'layovers',
          layovers: [],
        },
      ],
      hotels: [],
    })
    expect(result.success).toBe(false)
  })

  it('rejects hotel without dates or nights', () => {
    const result = budgetSchema.safeParse({
      ...baseHeader,
      flights: [],
      hotels: [
        {
          name: 'Sin fechas',
          roomType: 'standard',
          breakfast: false,
          allInclusive: false,
        },
      ],
    })
    expect(result.success).toBe(false)
  })

  it('rejects hotel when dateFrom is after dateTo', () => {
    const result = budgetSchema.safeParse({
      ...baseHeader,
      flights: [],
      hotels: [
        {
          name: 'Fechas invertidas',
          dateFrom: new Date('2026-06-10'),
          dateTo: new Date('2026-06-01'),
          roomType: 'double',
          breakfast: true,
          allInclusive: false,
        },
      ],
    })
    expect(result.success).toBe(false)
  })

  it('rejects negative flight price', () => {
    const result = budgetSchema.safeParse({
      ...baseHeader,
      flights: [
        {
          route: 'EZE → BRC',
          duration: '2h',
          type: 'direct',
          layovers: [],
          priceUsd: -10,
        },
      ],
      hotels: [],
    })
    expect(result.success).toBe(false)
  })
})

describe('defaultBudgetValues', () => {
  it('starts with empty flights and hotels arrays', () => {
    const defaults = defaultBudgetValues()
    expect(defaults.flights).toEqual([])
    expect(defaults.hotels).toEqual([])
    expect(defaults.passengers).toBe(1)
  })

  it('default flight and hotel factories match schema shape', () => {
    expect(defaultFlight().type).toBe('direct')
    expect(defaultFlight().layovers).toEqual([])
    expect(defaultHotel().roomType).toBe('standard')
  })
})
