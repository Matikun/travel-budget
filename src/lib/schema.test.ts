import { describe, expect, it } from 'vitest'

import {
  budgetSchema,
  defaultBudgetValues,
  defaultCarRental,
  defaultExcursion,
  defaultFlight,
  defaultHotel,
  defaultTransfer,
  defaultTravelAssistance,
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
}

describe('budgetSchema', () => {
  it('accepts header only with empty flights and hotels', () => {
    const result = budgetSchema.safeParse({
      ...baseHeader,
      flights: [],
      hotels: [],
      ...emptySections,
    })
    expect(result.success).toBe(true)
  })

  it('rejects missing destination', () => {
    const result = budgetSchema.safeParse({
      ...baseHeader,
      destination: '',
      flights: [],
      hotels: [],
      ...emptySections,
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
      ...emptySections,
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
      ...emptySections,
    })
    expect(result.success).toBe(false)
  })

  it('rejects passengers above 99', () => {
    const result = budgetSchema.safeParse({
      ...baseHeader,
      passengers: 100,
      flights: [],
      hotels: [],
      ...emptySections,
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
      ...emptySections,
    })
    expect(result.success).toBe(true)
  })

  it('accepts excursions, transfers, and enabled assistance', () => {
    const result = budgetSchema.safeParse({
      ...baseHeader,
      flights: [],
      hotels: [],
      excursions: [{ name: 'City tour', description: 'Medio día', priceUsd: 80 }],
      transfers: [
        { from: 'Aeropuerto', to: 'Hotel', description: 'Privado', priceUsd: 35 },
      ],
      carRentals: [],
      travelAssistance: {
        enabled: true,
        description: 'Cobertura médica',
        priceUsd: 25,
      },
      showTotalInPdf: false,
    })
    expect(result.success).toBe(true)
  })

  it('rejects enabled assistance without description', () => {
    const result = budgetSchema.safeParse({
      ...baseHeader,
      flights: [],
      hotels: [],
      ...emptySections,
      travelAssistance: { enabled: true, description: '  ' },
    })
    expect(result.success).toBe(false)
  })

  it('rejects excursion without name', () => {
    const result = budgetSchema.safeParse({
      ...baseHeader,
      flights: [],
      hotels: [],
      excursions: [{ name: '', priceUsd: 10 }],
      transfers: [],
      carRentals: [] as const,
      travelAssistance: { enabled: false },
      showTotalInPdf: true,
    })
    expect(result.success).toBe(false)
  })

  it('rejects transfer without from or to', () => {
    const result = budgetSchema.safeParse({
      ...baseHeader,
      flights: [],
      hotels: [],
      excursions: [],
      transfers: [{ from: '', to: 'Hotel', priceUsd: 10 }],
      carRentals: [] as const,
      travelAssistance: { enabled: false },
      showTotalInPdf: true,
    })
    expect(result.success).toBe(false)
  })

  it('accepts car rental with dates and locations', () => {
    const result = budgetSchema.safeParse({
      ...baseHeader,
      flights: [],
      hotels: [],
      ...emptySections,
      carRentals: [
        {
          dateFrom: new Date('2026-06-02'),
          dateTo: new Date('2026-06-08'),
          timeFrom: '09:30',
          timeTo: '17:00',
          pickupLocation: 'Aeropuerto',
          returnLocation: 'Centro',
          description: 'Compacto',
          priceUsd: 120,
        },
      ],
    })
    expect(result.success).toBe(true)
  })

  it('rejects car rental without pickup or return location', () => {
    const result = budgetSchema.safeParse({
      ...baseHeader,
      flights: [],
      hotels: [],
      ...emptySections,
      carRentals: [
        {
          dateFrom: new Date('2026-06-02'),
          dateTo: new Date('2026-06-08'),
          timeFrom: '09:30',
          timeTo: '17:00',
          pickupLocation: '',
          returnLocation: 'Centro',
        },
      ],
    })
    expect(result.success).toBe(false)
  })

  it('rejects car rental when return date is before pickup date', () => {
    const result = budgetSchema.safeParse({
      ...baseHeader,
      flights: [],
      hotels: [],
      ...emptySections,
      carRentals: [
        {
          dateFrom: new Date('2026-06-10'),
          dateTo: new Date('2026-06-02'),
          timeFrom: '09:00',
          timeTo: '18:00',
          pickupLocation: 'Aeropuerto',
          returnLocation: 'Centro',
        },
      ],
    })
    expect(result.success).toBe(false)
  })

  it('rejects car rental without pickup or return times', () => {
    const result = budgetSchema.safeParse({
      ...baseHeader,
      flights: [],
      hotels: [],
      ...emptySections,
      carRentals: [
        {
          dateFrom: new Date('2026-06-02'),
          dateTo: new Date('2026-06-08'),
          pickupLocation: 'Aeropuerto',
          returnLocation: 'Centro',
        },
      ],
    })
    expect(result.success).toBe(false)
  })

  it('rejects car rental when return time is not after pickup on same day', () => {
    const result = budgetSchema.safeParse({
      ...baseHeader,
      flights: [],
      hotels: [],
      ...emptySections,
      carRentals: [
        {
          dateFrom: new Date('2026-06-02'),
          dateTo: new Date('2026-06-02'),
          timeFrom: '18:00',
          timeTo: '10:00',
          pickupLocation: 'Aeropuerto',
          returnLocation: 'Centro',
        },
      ],
    })
    expect(result.success).toBe(false)
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
      ...emptySections,
    })
    expect(result.success).toBe(false)
  })

  it('accepts flight with optional departure and arrival dates', () => {
    const result = budgetSchema.safeParse({
      ...baseHeader,
      flights: [
        {
          route: 'EZE → BRC',
          duration: '2h 15m',
          dateFrom: new Date('2026-06-01'),
          timeFrom: '08:30',
          dateTo: new Date('2026-06-01'),
          timeTo: '10:45',
          type: 'direct',
          layovers: [],
          priceUsd: 350,
        },
      ],
      hotels: [],
      ...emptySections,
    })
    expect(result.success).toBe(true)
  })

  it('rejects flight with invalid departure time', () => {
    const result = budgetSchema.safeParse({
      ...baseHeader,
      flights: [
        {
          route: 'EZE → BRC',
          duration: '2h 15m',
          timeFrom: '8:30',
          type: 'direct',
          layovers: [],
        },
      ],
      hotels: [],
      ...emptySections,
    })
    expect(result.success).toBe(false)
  })

  it('rejects flight when dateFrom is after dateTo', () => {
    const result = budgetSchema.safeParse({
      ...baseHeader,
      flights: [
        {
          route: 'EZE → BRC',
          duration: '2h 15m',
          dateFrom: new Date('2026-06-10'),
          dateTo: new Date('2026-06-01'),
          type: 'direct',
          layovers: [],
        },
      ],
      hotels: [],
      ...emptySections,
    })
    expect(result.success).toBe(false)
    if (!result.success) {
      const paths = result.error.issues.map((issue) => issue.path.join('.'))
      expect(paths).toContain('flights.0.dateTo')
    }
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
      ...emptySections,
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
      ...emptySections,
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
      ...emptySections,
    })
    expect(result.success).toBe(false)
  })

  it('defaults includeLogoInPdf to false when omitted', () => {
    const result = budgetSchema.safeParse({
      ...baseHeader,
      flights: [],
      hotels: [],
      excursions: [] as const,
      transfers: [] as const,
      carRentals: [] as const,
      travelAssistance: { enabled: false as const },
      showTotalInPdf: true,
    })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.includeLogoInPdf).toBe(false)
      expect(result.data.hideIndividualPricesInPdf).toBe(false)
    }
  })

  it('accepts hideIndividualPricesInPdf true', () => {
    const result = budgetSchema.safeParse({
      ...baseHeader,
      flights: [],
      hotels: [],
      ...emptySections,
      hideIndividualPricesInPdf: true,
    })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.hideIndividualPricesInPdf).toBe(true)
    }
  })

  it('accepts includeLogoInPdf true', () => {
    const result = budgetSchema.safeParse({
      ...baseHeader,
      flights: [],
      hotels: [],
      ...emptySections,
      includeLogoInPdf: true,
    })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.includeLogoInPdf).toBe(true)
    }
  })
})

describe('defaultBudgetValues', () => {
  it('starts with empty dynamic sections', () => {
    const defaults = defaultBudgetValues()
    expect(defaults.flights).toEqual([])
    expect(defaults.hotels).toEqual([])
    expect(defaults.excursions).toEqual([])
    expect(defaults.transfers).toEqual([])
    expect(defaults.carRentals).toEqual([])
    expect(defaults.travelAssistance.enabled).toBe(false)
    expect(defaults.showTotalInPdf).toBe(true)
    expect(defaults.hideIndividualPricesInPdf).toBe(false)
    expect(defaults.includeLogoInPdf).toBe(false)
    expect(defaults.passengers).toBe(1)
  })

  it('default factories match schema shape', () => {
    expect(defaultFlight().type).toBe('direct')
    expect(defaultFlight().layovers).toEqual([])
    expect(defaultFlight().showPriceInPdf).toBe(true)
    expect(defaultFlight().route).toBe('')
    expect(defaultFlight().dateFrom).toBeUndefined()
    expect(defaultFlight().timeFrom).toBeUndefined()
    expect(defaultFlight().dateTo).toBeUndefined()
    expect(defaultFlight().timeTo).toBeUndefined()
    expect(defaultHotel().roomType).toBe('standard')
    expect(defaultHotel().showPriceInPdf).toBe(true)
    expect(defaultExcursion().name).toBe('')
    expect(defaultExcursion().showPriceInPdf).toBe(true)
    expect(defaultTransfer().from).toBe('')
    expect(defaultTransfer().showPriceInPdf).toBe(true)
    expect(defaultCarRental().showPriceInPdf).toBe(true)
    expect(defaultTravelAssistance().showPriceInPdf).toBe(true)
  })

  it('defaults showPriceInPdf to true when omitted on line items', () => {
    const result = budgetSchema.safeParse({
      ...baseHeader,
      flights: [
        {
          route: 'A → B',
          duration: '2h',
          type: 'direct',
          layovers: [],
          priceUsd: 100,
        },
      ],
      hotels: [],
      excursions: [],
      transfers: [],
      carRentals: [],
      travelAssistance: { enabled: false },
      showTotalInPdf: true,
    })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.flights[0]?.showPriceInPdf).toBe(true)
    }
  })
})

describe('sampleBudgetValues', () => {
  it('passes full budget validation', () => {
    const result = budgetSchema.safeParse(sampleBudgetValues())
    expect(result.success).toBe(true)
  })

  it('includes all sections for manual QA', () => {
    const sample = sampleBudgetValues()
    expect(sample.flights.length).toBeGreaterThan(0)
    expect(sample.hotels.length).toBeGreaterThan(0)
    expect(sample.excursions.length).toBeGreaterThan(0)
    expect(sample.transfers.length).toBeGreaterThan(0)
    expect(sample.carRentals.length).toBeGreaterThan(0)
    expect(sample.travelAssistance.enabled).toBe(true)
  })
})
