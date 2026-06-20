import { describe, expect, it } from 'vitest'

import {
  budgetFormSchema,
  defaultExcursion,
  defaultTransfer,
  sampleBudgetValues,
} from './schema'

const baseHeader = {
  destination: 'Bariloche',
  dateFrom: new Date('2026-06-01'),
  dateTo: new Date('2026-06-10'),
  passengers: 2,
}

const emptySections = {
  excursions: [] as const,
  transfers: [] as const,
  carRentals: [] as const,
  travelAssistance: { enabled: false as const },
  showTotalInPdf: true,
  hideIndividualPricesInPdf: false,
  includeLogoInPdf: false,
  pdfLayout: 'budget' as const,
}

describe('budgetSchema itinerary mode', () => {
  it('allows excursions and transfers without dates in budget mode', () => {
    const result = budgetFormSchema.safeParse({
      ...baseHeader,
      flights: [],
      hotels: [],
      ...emptySections,
      excursions: [{ ...defaultExcursion(), name: 'Tour sin fecha' }],
      transfers: [
        {
          ...defaultTransfer(),
          from: 'A',
          to: 'B',
        },
      ],
    })

    expect(result.success).toBe(true)
  })

  it('requires excursion date in itinerary mode when row has data', () => {
    const result = budgetFormSchema.safeParse({
      ...baseHeader,
      flights: [],
      hotels: [],
      ...emptySections,
      pdfLayout: 'itinerary',
      excursions: [{ ...defaultExcursion(), name: 'Tour sin fecha' }],
    })

    expect(result.success).toBe(false)
    if (!result.success) {
      const paths = result.error.issues.map((issue) => issue.path.join('.'))
      expect(paths).toContain('excursions.0.date')
    }
  })

  it('requires transfer date in itinerary mode when row has data', () => {
    const result = budgetFormSchema.safeParse({
      ...baseHeader,
      flights: [],
      hotels: [],
      ...emptySections,
      pdfLayout: 'itinerary',
      transfers: [
        {
          ...defaultTransfer(),
          from: 'A',
          to: 'B',
        },
      ],
    })

    expect(result.success).toBe(false)
    if (!result.success) {
      const paths = result.error.issues.map((issue) => issue.path.join('.'))
      expect(paths).toContain('transfers.0.date')
    }
  })

  it('accepts sample budget in itinerary mode when dates are filled', () => {
    const sample = sampleBudgetValues()
    const result = budgetFormSchema.safeParse({
      ...sample,
      pdfLayout: 'itinerary',
    })

    expect(result.success).toBe(true)
  })
})
