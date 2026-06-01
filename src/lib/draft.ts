import {
  budgetFormSchema,
  defaultBudgetValues,
  type BudgetFormValues,
  type CarRental,
  type Flight,
  type Hotel,
} from './schema'

export const DRAFT_STORAGE_KEY = 'travel-budget-draft-v1'
export const DRAFT_VERSION = 1 as const

export type DraftParseResult =
  | { status: 'ok'; values: BudgetFormValues; savedAt: string }
  | { status: 'incompatible' }
  | { status: 'invalid' }
  | { status: 'missing' }

type SerializedFlight = Omit<Flight, 'dateFrom' | 'dateTo'> & {
  dateFrom?: string
  dateTo?: string
}

type SerializedHotel = Omit<Hotel, 'dateFrom' | 'dateTo'> & {
  dateFrom?: string
  dateTo?: string
}

type SerializedCarRental = Omit<CarRental, 'dateFrom' | 'dateTo'> & {
  dateFrom?: string
  dateTo?: string
}

export type SerializedBudgetFormValues = Omit<
  BudgetFormValues,
  'dateFrom' | 'dateTo' | 'flights' | 'hotels' | 'carRentals'
> & {
  dateFrom?: string
  dateTo?: string
  flights: SerializedFlight[]
  hotels: SerializedHotel[]
  carRentals?: SerializedCarRental[]
}

export type DraftEnvelope = {
  version: typeof DRAFT_VERSION
  savedAt: string
  values: SerializedBudgetFormValues
}

function serializeDate(value: Date | undefined): string | undefined {
  return value === undefined ? undefined : value.toISOString()
}

function deserializeDate(value: string | undefined): Date | undefined {
  if (value === undefined) {
    return undefined
  }
  const parsed = new Date(value)
  return Number.isNaN(parsed.getTime()) ? undefined : parsed
}

export function serializeBudgetValues(
  values: BudgetFormValues,
): SerializedBudgetFormValues {
  return {
    ...values,
    dateFrom: serializeDate(values.dateFrom),
    dateTo: serializeDate(values.dateTo),
    flights: values.flights.map((flight) => ({
      ...flight,
      dateFrom: serializeDate(flight.dateFrom),
      dateTo: serializeDate(flight.dateTo),
    })),
    hotels: values.hotels.map((hotel) => ({
      ...hotel,
      dateFrom: serializeDate(hotel.dateFrom),
      dateTo: serializeDate(hotel.dateTo),
    })),
    carRentals: values.carRentals.map((rental) => ({
      ...rental,
      dateFrom: serializeDate(rental.dateFrom),
      dateTo: serializeDate(rental.dateTo),
    })),
  }
}

export function deserializeBudgetValues(
  serialized: SerializedBudgetFormValues,
): BudgetFormValues {
  return {
    ...serialized,
    dateFrom: deserializeDate(serialized.dateFrom),
    dateTo: deserializeDate(serialized.dateTo),
    flights: serialized.flights.map((flight) => ({
      ...flight,
      dateFrom: deserializeDate(flight.dateFrom),
      dateTo: deserializeDate(flight.dateTo),
    })),
    hotels: serialized.hotels.map((hotel) => ({
      ...hotel,
      dateFrom: deserializeDate(hotel.dateFrom),
      dateTo: deserializeDate(hotel.dateTo),
    })),
    carRentals: (serialized.carRentals ?? []).map((rental) => ({
      ...rental,
      dateFrom: deserializeDate(rental.dateFrom),
      dateTo: deserializeDate(rental.dateTo),
    })),
  }
}

export function createDraftEnvelope(
  values: BudgetFormValues,
  savedAt = new Date().toISOString(),
): DraftEnvelope {
  return {
    version: DRAFT_VERSION,
    savedAt,
    values: serializeBudgetValues(values),
  }
}

export function serializeDraft(values: BudgetFormValues): string {
  return JSON.stringify(createDraftEnvelope(values))
}

export function parseDraftJson(raw: string): DraftParseResult {
  let parsed: unknown
  try {
    parsed = JSON.parse(raw)
  } catch {
    return { status: 'invalid' }
  }

  if (
    typeof parsed !== 'object' ||
    parsed === null ||
    !('version' in parsed) ||
    !('values' in parsed) ||
    !('savedAt' in parsed)
  ) {
    return { status: 'invalid' }
  }

  const envelope = parsed as Partial<DraftEnvelope>

  if (envelope.version !== DRAFT_VERSION) {
    return { status: 'incompatible' }
  }

  if (
    typeof envelope.savedAt !== 'string' ||
    typeof envelope.values !== 'object' ||
    envelope.values === null
  ) {
    return { status: 'invalid' }
  }

  const values = deserializeBudgetValues(
    envelope.values as SerializedBudgetFormValues,
  )
  const validation = budgetFormSchema.safeParse(values)

  if (!validation.success) {
    return { status: 'invalid' }
  }

  return {
    status: 'ok',
    values: validation.data,
    savedAt: envelope.savedAt,
  }
}

export function draftHasContent(values: BudgetFormValues): boolean {
  if (values.destination.trim().length > 0) {
    return true
  }
  if (values.dateFrom !== undefined || values.dateTo !== undefined) {
    return true
  }
  if (values.passengers !== 1) {
    return true
  }
  if (values.flights.length > 0) {
    return true
  }
  if (values.hotels.length > 0) {
    return true
  }
  if (values.excursions.length > 0) {
    return true
  }
  if (values.transfers.length > 0) {
    return true
  }
  if (values.carRentals.length > 0) {
    return true
  }
  if (values.travelAssistance.enabled) {
    return true
  }
  if (!values.showTotalInPdf) {
    return true
  }
  if (values.hideIndividualPricesInPdf) {
    return true
  }
  if (values.includeLogoInPdf) {
    return true
  }

  return false
}

export function readStoredDraft(storage?: Storage): DraftParseResult {
  const store = storage ?? getBrowserStorage()
  if (!store) {
    return { status: 'missing' }
  }

  const raw = store.getItem(DRAFT_STORAGE_KEY)
  if (!raw) {
    return { status: 'missing' }
  }

  return parseDraftJson(raw)
}

export function writeStoredDraft(
  values: BudgetFormValues,
  storage?: Storage,
): void {
  const store = storage ?? getBrowserStorage()
  if (!store || !draftHasContent(values)) {
    return
  }

  store.setItem(DRAFT_STORAGE_KEY, serializeDraft(values))
}

export function clearStoredDraft(storage?: Storage): void {
  const store = storage ?? getBrowserStorage()
  store?.removeItem(DRAFT_STORAGE_KEY)
}

export function exportDraftJson(values: BudgetFormValues): string {
  return serializeDraft(values)
}

export function importDraftJson(raw: string): DraftParseResult {
  return parseDraftJson(raw)
}

export function freshBudgetValues(): BudgetFormValues {
  return defaultBudgetValues()
}

function getBrowserStorage(): Storage | undefined {
  if (typeof window === 'undefined') {
    return undefined
  }
  return window.localStorage
}
