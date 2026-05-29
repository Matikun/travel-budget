import type { Excursion, Flight, Hotel, Layover, Transfer } from '@/lib/schema'

function hasText(value: string | undefined): boolean {
  return Boolean(value?.trim())
}

function hasPrice(value: number | undefined): boolean {
  return value !== undefined
}

export function layoverHasData(layover: Layover): boolean {
  return hasText(layover.where) || hasText(layover.duration)
}

export function flightHasData(flight: Flight): boolean {
  return (
    hasText(flight.route) ||
    hasText(flight.duration) ||
    hasText(flight.description) ||
    hasPrice(flight.priceUsd) ||
    flight.layovers.some(layoverHasData)
  )
}

export function hotelHasData(hotel: Hotel): boolean {
  return (
    hasText(hotel.name) ||
    hotel.dateFrom !== undefined ||
    hotel.dateTo !== undefined ||
    hotel.nights !== undefined ||
    hasPrice(hotel.priceUsd)
  )
}

export function excursionHasData(excursion: Excursion): boolean {
  return (
    hasText(excursion.name) ||
    hasText(excursion.description) ||
    hasPrice(excursion.priceUsd)
  )
}

export function transferHasData(transfer: Transfer): boolean {
  return (
    hasText(transfer.from) ||
    hasText(transfer.to) ||
    hasText(transfer.description) ||
    hasPrice(transfer.priceUsd)
  )
}
