import { describe, expect, it } from 'vitest'

import {
  defaultCarRental,
  defaultExcursion,
  defaultFlight,
  defaultHotel,
  defaultLayover,
  defaultTransfer,
} from '@/lib/schema'

import {
  carRentalHasData,
  excursionHasData,
  flightHasData,
  hotelHasData,
  layoverHasData,
  transferHasData,
} from './row-has-data'

describe('row-has-data', () => {
  it('detects empty defaults', () => {
    expect(flightHasData(defaultFlight())).toBe(false)
    expect(hotelHasData(defaultHotel())).toBe(false)
    expect(excursionHasData(defaultExcursion())).toBe(false)
    expect(transferHasData(defaultTransfer())).toBe(false)
    expect(carRentalHasData(defaultCarRental())).toBe(false)
    expect(layoverHasData(defaultLayover())).toBe(false)
  })

  it('detects meaningful row content', () => {
    expect(flightHasData({ ...defaultFlight(), route: 'EZE → BRC' })).toBe(true)
    expect(hotelHasData({ ...defaultHotel(), nights: 3 })).toBe(true)
    expect(
      excursionHasData({ ...defaultExcursion(), description: 'Medio día' }),
    ).toBe(true)
    expect(
      transferHasData({ ...defaultTransfer(), priceUsd: 0 }),
    ).toBe(true)
    expect(
      carRentalHasData({
        ...defaultCarRental(),
        timeFrom: '10:00',
      }),
    ).toBe(true)
  })
})
