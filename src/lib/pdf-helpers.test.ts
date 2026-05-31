import { describe, expect, it } from 'vitest'

import {
  budgetHasCarRentals,
  budgetHasExcursions,
  budgetHasFlights,
  budgetHasHotels,
  budgetHasTransfers,
  budgetHasTravelAssistance,
  buildQuoteFilename,
  resolvePdfLogo,
  shouldShowIndividualPricesInPdf,
  shouldShowPdfTotal,
  slugifyDestination,
} from './pdf-helpers'

const sampleLogoDataUrl = 'data:image/png;base64,abc'
describe('slugifyDestination', () => {
  it('lowercases and replaces spaces', () => {
    expect(slugifyDestination('Bariloche 2026')).toBe('bariloche-2026')
  })

  it('strips accents', () => {
    expect(slugifyDestination('Córdoba')).toBe('cordoba')
  })

  it('falls back when empty after sanitizing', () => {
    expect(slugifyDestination('   !!!   ')).toBe('presupuesto')
  })
})

describe('buildQuoteFilename', () => {
  it('builds quote slug with ISO date', () => {
    expect(
      buildQuoteFilename('Patagonia', new Date(2026, 4, 15)),
    ).toBe('quote-patagonia-2026-05-15.pdf')
  })
})

describe('budget section helpers', () => {
  it('detects flights section', () => {
    expect(budgetHasFlights({ flights: [] })).toBe(false)
    expect(
      budgetHasFlights({
        flights: [
          {
            route: 'A',
            duration: '2h',
            type: 'direct',
            layovers: [],
          },
        ],
      }),
    ).toBe(true)
  })

  it('detects hotels section', () => {
    expect(budgetHasHotels({ hotels: [] })).toBe(false)
    expect(
      budgetHasHotels({
        hotels: [
          {
            name: 'Hotel',
            roomType: 'standard',
            breakfast: false,
            allInclusive: false,
            nights: 2,
          },
        ],
      }),
    ).toBe(true)
  })

  it('detects excursions section', () => {
    expect(budgetHasExcursions({ excursions: [] })).toBe(false)
    expect(
      budgetHasExcursions({
        excursions: [{ name: 'City tour' }],
      }),
    ).toBe(true)
  })

  it('detects transfers section', () => {
    expect(budgetHasTransfers({ transfers: [] })).toBe(false)
    expect(
      budgetHasTransfers({
        transfers: [{ from: 'A', to: 'B' }],
      }),
    ).toBe(true)
  })

  it('detects car rentals section', () => {
    expect(budgetHasCarRentals({ carRentals: [] })).toBe(false)
    expect(
      budgetHasCarRentals({
        carRentals: [
          {
            dateFrom: new Date('2026-06-01'),
            dateTo: new Date('2026-06-05'),
            timeFrom: '10:00',
            timeTo: '18:00',
            pickupLocation: 'A',
            returnLocation: 'B',
          },
        ],
      }),
    ).toBe(true)
  })

  it('detects travel assistance when enabled', () => {
    expect(
      budgetHasTravelAssistance({
        travelAssistance: { enabled: false },
      }),
    ).toBe(false)
    expect(
      budgetHasTravelAssistance({
        travelAssistance: { enabled: true, description: 'Plan' },
      }),
    ).toBe(true)
  })
})

describe('shouldShowPdfTotal', () => {
  it('requires toggle on and positive sum', () => {
    expect(shouldShowPdfTotal({ showTotalInPdf: true }, 100)).toBe(true)
    expect(shouldShowPdfTotal({ showTotalInPdf: false }, 100)).toBe(false)
    expect(shouldShowPdfTotal({ showTotalInPdf: true }, 0)).toBe(false)
  })
})

describe('shouldShowIndividualPricesInPdf', () => {
  it('hides line prices when toggle is on', () => {
    expect(
      shouldShowIndividualPricesInPdf({ hideIndividualPricesInPdf: false }),
    ).toBe(true)
    expect(
      shouldShowIndividualPricesInPdf({ hideIndividualPricesInPdf: true }),
    ).toBe(false)
  })
})

describe('resolvePdfLogo', () => {
  it('returns undefined when toggle is off', () => {
    expect(resolvePdfLogo(false, sampleLogoDataUrl)).toBeUndefined()
  })

  it('returns undefined when no logo is stored', () => {
    expect(resolvePdfLogo(true, null)).toBeUndefined()
  })

  it('returns dataUrl when toggle is on and logo exists', () => {
    expect(resolvePdfLogo(true, sampleLogoDataUrl)).toBe(sampleLogoDataUrl)
  })
})