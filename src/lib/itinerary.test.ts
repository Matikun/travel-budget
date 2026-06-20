import { describe, expect, it } from 'vitest'

import { buildItineraryEntries, getItineraryEntryDate } from './itinerary'
import type { Budget } from './schema'

function makeBudget(overrides: Partial<Budget> = {}): Budget {
  return {
    destination: 'Test',
    additionalInfo: '',
    dateFrom: new Date(2026, 5, 1),
    dateTo: new Date(2026, 5, 10),
    passengers: 2,
    flights: [],
    hotels: [],
    excursions: [],
    transfers: [],
    carRentals: [],
    travelAssistance: {
      enabled: false,
      description: '',
      showPriceInPdf: true,
    },
    showTotalInPdf: true,
    hideIndividualPricesInPdf: false,
    includeLogoInPdf: false,
    pdfLayout: 'itinerary',
    ...overrides,
  }
}

describe('buildItineraryEntries', () => {
  it('sorts items by date then time then kind', () => {
    const budget = makeBudget({
      flights: [
        {
          route: 'Late flight',
          duration: '2h',
          dateFrom: new Date(2026, 5, 12),
          timeFrom: '18:00',
          type: 'direct',
          layovers: [],
          showPriceInPdf: true,
        },
        {
          route: 'Early flight',
          duration: '2h',
          dateFrom: new Date(2026, 5, 10),
          timeFrom: '08:30',
          type: 'direct',
          layovers: [],
          showPriceInPdf: true,
        },
      ],
      hotels: [
        {
          name: 'Hotel',
          dateFrom: new Date(2026, 5, 10),
          roomType: 'double',
          breakfast: false,
          allInclusive: false,
          showPriceInPdf: true,
        },
      ],
      excursions: [
        {
          name: 'Tour',
          date: new Date(2026, 5, 11),
          time: '09:00',
          showPriceInPdf: true,
        },
      ],
      transfers: [
        {
          from: 'A',
          to: 'B',
          date: new Date(2026, 5, 10),
          time: '07:00',
          showPriceInPdf: true,
        },
      ],
    })

    const entries = buildItineraryEntries(budget)

    expect(entries.map((entry) => entry.kind)).toEqual([
      'transfer',
      'flight',
      'hotel',
      'excursion',
      'flight',
    ])
  })

  it('places undated items after dated items', () => {
    const budget = makeBudget({
      flights: [
        {
          route: 'Undated',
          duration: '2h',
          type: 'direct',
          layovers: [],
          showPriceInPdf: true,
        },
        {
          route: 'Dated',
          duration: '2h',
          dateFrom: new Date(2026, 5, 10),
          type: 'direct',
          layovers: [],
          showPriceInPdf: true,
        },
      ],
    })

    const entries = buildItineraryEntries(budget)

    expect(entries[0]?.kind).toBe('flight')
    expect(entries[0]?.index).toBe(1)
    expect(entries[1]?.index).toBe(0)
  })

  it('getItineraryEntryDate returns the entry sort date', () => {
    const date = new Date(2026, 5, 11)
    const budget = makeBudget({
      excursions: [{ name: 'Tour', date, showPriceInPdf: true }],
    })

    const entry = buildItineraryEntries(budget)[0]
    expect(entry).toBeDefined()
    expect(getItineraryEntryDate(budget, entry!)).toEqual(date)
  })
})
