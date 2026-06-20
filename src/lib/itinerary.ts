import type { Budget } from './schema'

export type ItineraryItemKind =
  | 'flight'
  | 'hotel'
  | 'excursion'
  | 'transfer'
  | 'carRental'

export type ItineraryEntry = {
  kind: ItineraryItemKind
  index: number
}

const KIND_ORDER: Record<ItineraryItemKind, number> = {
  flight: 0,
  hotel: 1,
  excursion: 2,
  transfer: 3,
  carRental: 4,
}

type SortableItem = {
  entry: ItineraryEntry
  dateMs: number | null
  timeMinutes: number
  hasTime: boolean
  sequence: number
}

function timeToMinutes(time: string | undefined): number {
  if (!time) {
    return 0
  }

  const [hours, minutes] = time.split(':').map(Number)
  return hours * 60 + minutes
}

function startOfDayMs(date: Date): number {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime()
}

function compareSortable(a: SortableItem, b: SortableItem): number {
  const aHasDate = a.dateMs !== null
  const bHasDate = b.dateMs !== null

  if (aHasDate && !bHasDate) {
    return -1
  }
  if (!aHasDate && bHasDate) {
    return 1
  }

  if (aHasDate && bHasDate && a.dateMs !== b.dateMs) {
    return a.dateMs! - b.dateMs!
  }

  if (aHasDate && bHasDate && a.timeMinutes !== b.timeMinutes) {
    const aTimed = a.hasTime
    const bTimed = b.hasTime

    if (aTimed && bTimed) {
      return a.timeMinutes - b.timeMinutes
    }

    if (aTimed !== bTimed) {
      return aTimed ? -1 : 1
    }
  }

  const kindDiff = KIND_ORDER[a.entry.kind] - KIND_ORDER[b.entry.kind]
  if (kindDiff !== 0) {
    return kindDiff
  }

  return a.sequence - b.sequence
}

/** Builds chronologically sorted itinerary entries for PDF rendering. */
export function buildItineraryEntries(budget: Budget): ItineraryEntry[] {
  let sequence = 0
  const items: SortableItem[] = []

  const push = (
    kind: ItineraryItemKind,
    index: number,
    date: Date | undefined,
    time: string | undefined,
  ) => {
    items.push({
      entry: { kind, index },
      dateMs: date ? startOfDayMs(date) : null,
      timeMinutes: timeToMinutes(time),
      hasTime: Boolean(time),
      sequence: sequence++,
    })
  }

  budget.flights.forEach((flight, index) => {
    push('flight', index, flight.dateFrom, flight.timeFrom)
  })

  budget.hotels.forEach((hotel, index) => {
    push('hotel', index, hotel.dateFrom, undefined)
  })

  budget.excursions.forEach((excursion, index) => {
    push('excursion', index, excursion.date, excursion.time)
  })

  budget.transfers.forEach((transfer, index) => {
    push('transfer', index, transfer.date, transfer.time)
  })

  budget.carRentals.forEach((rental, index) => {
    push('carRental', index, rental.dateFrom, rental.timeFrom)
  })

  return items.sort(compareSortable).map((item) => item.entry)
}

export type ItineraryRenderItem = {
  entry: ItineraryEntry
  showDayHeading: boolean
  entryDate?: Date
}

/** Builds sorted entries with day-heading flags for PDF rendering. */
export function buildItineraryRenderItems(budget: Budget): ItineraryRenderItem[] {
  const entries = buildItineraryEntries(budget)
  let previousDate: Date | undefined

  return entries.map((entry) => {
    const entryDate = getItineraryEntryDate(budget, entry)
    const showDayHeading =
      entryDate !== undefined &&
      (previousDate === undefined ||
        !isSameCalendarDay(previousDate, entryDate))

    if (entryDate) {
      previousDate = entryDate
    }

    return {
      entry,
      showDayHeading,
      entryDate,
    }
  })
}

/** Returns the sort date for an itinerary entry (for day headings in PDF). */
export function getItineraryEntryDate(
  budget: Budget,
  entry: ItineraryEntry,
): Date | undefined {
  switch (entry.kind) {
    case 'flight':
      return budget.flights[entry.index]?.dateFrom
    case 'hotel':
      return budget.hotels[entry.index]?.dateFrom
    case 'excursion':
      return budget.excursions[entry.index]?.date
    case 'transfer':
      return budget.transfers[entry.index]?.date
    case 'carRental':
      return budget.carRentals[entry.index]?.dateFrom
    default:
      return undefined
  }
}

/** Whether two dates fall on the same calendar day. */
export function isSameCalendarDay(a: Date, b: Date): boolean {
  return startOfDayMs(a) === startOfDayMs(b)
}
