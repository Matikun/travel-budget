import {
  Document,
  Image,
  Page,
  Text,
  View,
} from '@react-pdf/renderer'

import { formatCarRentalDateTime, formatDate, formatUsd } from '@/lib/format'
import {
  buildItineraryRenderItems,
  type ItineraryEntry,
} from '@/lib/itinerary'
import { PRICE_DISCLAIMER } from '@/lib/quote-copy'
import {
  budgetHasCarRentals,
  budgetHasExcursions,
  budgetHasFlights,
  budgetHasHotels,
  budgetHasTransfers,
  budgetHasTravelAssistance,
  shouldShowItemPriceInPdf,
  shouldShowItemPhotoInPdf,
  shouldShowPdfTotal,
} from '@/lib/pdf-helpers'
import type { Budget, CarRental, Excursion, Flight, Hotel, RoomType, Transfer } from '@/lib/schema'
import { calculateBudgetTotal } from '@/lib/totals'

import { pdfStyles } from './pdf-styles'

const ROOM_TYPE_LABELS: Record<RoomType, string> = {
  standard: 'Estándar',
  double: 'Doble',
  triple: 'Triple',
  luxury: 'Lujo',
}

type BudgetPdfProps = {
  budget: Budget
  logoDataUrl?: string
}

function PriceColumn({
  priceUsd,
  show,
}: {
  priceUsd?: number
  show: boolean
}) {
  if (!show || priceUsd === undefined || priceUsd === null) {
    return null
  }

  return <Text style={pdfStyles.itemPrice}>{formatUsd(priceUsd)}</Text>
}

function ItemPhoto({ photoDataUrl }: { photoDataUrl: string }) {
  return (
    <Image src={photoDataUrl} style={pdfStyles.itemPhoto} />
  )
}

function formatFlightSchedule(flight: Flight): { label: string; value: string }[] {
  const lines: { label: string; value: string }[] = []
  const departure = formatCarRentalDateTime(flight.dateFrom, flight.timeFrom)
  if (departure) {
    lines.push({ label: 'Salida', value: departure })
  }
  const arrival = formatCarRentalDateTime(flight.dateTo, flight.timeTo)
  if (arrival) {
    lines.push({ label: 'Llegada', value: arrival })
  }
  return lines
}

function FlightItem({
  flight,
  index,
  showItemPrices,
}: {
  flight: Flight
  index: number
  showItemPrices: boolean
}) {
  const flightSchedule = formatFlightSchedule(flight)

  return (
    <View style={pdfStyles.item} wrap={false}>
      <View style={pdfStyles.itemRow}>
        <View style={pdfStyles.itemMain}>
          <Text style={pdfStyles.itemTitle}>
            Vuelo {index + 1}: {flight.route}
          </Text>
          {flightSchedule.map((line) => (
            <Text key={line.label} style={pdfStyles.itemDetail}>
              <Text style={pdfStyles.itemDetailLabel}>{line.label}: </Text>
              {line.value}
            </Text>
          ))}
          <Text style={pdfStyles.itemDetail}>Duración: {flight.duration}</Text>
          <Text style={pdfStyles.itemDetail}>
            Tipo: {flight.type === 'direct' ? 'Directo' : 'Con escalas'}
          </Text>
          {flight.type === 'layovers' && flight.layovers.length > 0 ? (
            <View>
              {flight.layovers.map((layover, layoverIndex) => (
                <Text key={layoverIndex} style={pdfStyles.itemDetail}>
                  Escala {layoverIndex + 1}: {layover.where} ({layover.duration})
                </Text>
              ))}
            </View>
          ) : null}
          {flight.description?.trim() ? (
            <Text style={pdfStyles.itemDetail}>{flight.description}</Text>
          ) : null}
          {shouldShowItemPhotoInPdf(flight) && flight.photoDataUrl ? (
            <ItemPhoto photoDataUrl={flight.photoDataUrl} />
          ) : null}
        </View>
        <PriceColumn priceUsd={flight.priceUsd} show={showItemPrices} />
      </View>
    </View>
  )
}

function formatHotelStay(hotel: Hotel): string {
  const parts: string[] = []

  if (hotel.dateFrom && hotel.dateTo) {
    parts.push(
      `${formatDate(hotel.dateFrom)} — ${formatDate(hotel.dateTo)}`,
    )
  }

  if (hotel.nights !== undefined) {
    parts.push(
      `${hotel.nights} noche${hotel.nights === 1 ? '' : 's'}`,
    )
  }

  return parts.join(' · ')
}

function PdfHeaderTitle({ pdfLayout }: { pdfLayout: Budget['pdfLayout'] }) {
  return (
    <Text style={pdfStyles.title}>
      {pdfLayout === 'itinerary' ? 'Itinerario de viaje' : 'Presupuesto de viaje'}
    </Text>
  )
}

function formatCarRentalSchedule(
  date: Date | undefined,
  time: string | undefined,
  location: string,
): string {
  const when = formatCarRentalDateTime(date, time)
  return when ? `${when} — ${location}` : location
}

function CarRentalScheduleLine({
  label,
  value,
}: {
  label: string
  value: string
}) {
  return (
    <Text style={pdfStyles.itemDetail}>
      <Text style={pdfStyles.itemDetailLabel}>{label}: </Text>
      {value}
    </Text>
  )
}

function CarRentalItem({
  rental,
  index,
  showItemPrices,
}: {
  rental: CarRental
  index: number
  showItemPrices: boolean
}) {
  const pickup = formatCarRentalSchedule(
    rental.dateFrom,
    rental.timeFrom,
    rental.pickupLocation,
  )
  const dropoff = formatCarRentalSchedule(
    rental.dateTo,
    rental.timeTo,
    rental.returnLocation,
  )

  return (
    <View style={pdfStyles.item} wrap={false}>
      <View style={pdfStyles.itemRow}>
        <View style={pdfStyles.itemMain}>
          <Text style={pdfStyles.itemTitle}>Alquiler {index + 1}</Text>
          <CarRentalScheduleLine label="Retira" value={pickup} />
          <CarRentalScheduleLine label="Devuelve" value={dropoff} />
          {rental.description?.trim() ? (
            <Text style={pdfStyles.itemDetail}>{rental.description}</Text>
          ) : null}
        </View>
        <PriceColumn priceUsd={rental.priceUsd} show={showItemPrices} />
      </View>
    </View>
  )
}

function HotelItem({
  hotel,
  index,
  showItemPrices,
}: {
  hotel: Hotel
  index: number
  showItemPrices: boolean
}) {
  const amenities: string[] = []

  if (hotel.breakfast) {
    amenities.push('Desayuno incluido')
  }
  if (hotel.allInclusive) {
    amenities.push('All inclusive')
  }

  return (
    <View style={pdfStyles.item} wrap={false}>
      <View style={pdfStyles.itemRow}>
        <View style={pdfStyles.itemMain}>
          <Text style={pdfStyles.itemTitle}>
            Hotel {index + 1}: {hotel.name}
          </Text>
          <Text style={pdfStyles.itemDetail}>{formatHotelStay(hotel)}</Text>
          <Text style={pdfStyles.itemDetail}>
            Habitación: {ROOM_TYPE_LABELS[hotel.roomType]}
          </Text>
          {amenities.length > 0 ? (
            <Text style={pdfStyles.itemDetail}>{amenities.join(' · ')}</Text>
          ) : null}
          {shouldShowItemPhotoInPdf(hotel) && hotel.photoDataUrl ? (
            <ItemPhoto photoDataUrl={hotel.photoDataUrl} />
          ) : null}
        </View>
        <PriceColumn priceUsd={hotel.priceUsd} show={showItemPrices} />
      </View>
    </View>
  )
}

function ExcursionItem({
  excursion,
  showItemPrices,
}: {
  excursion: Excursion
  showItemPrices: boolean
}) {
  const schedule = formatCarRentalDateTime(excursion.date, excursion.time)

  return (
    <View style={pdfStyles.item} wrap={false}>
      <View style={pdfStyles.itemRow}>
        <View style={pdfStyles.itemMain}>
          <Text style={pdfStyles.itemTitle}>{excursion.name}</Text>
          {schedule ? (
            <Text style={pdfStyles.itemDetail}>
              <Text style={pdfStyles.itemDetailLabel}>Cuándo: </Text>
              {schedule}
            </Text>
          ) : null}
          {excursion.description?.trim() ? (
            <Text style={pdfStyles.itemDetail}>{excursion.description}</Text>
          ) : null}
          {shouldShowItemPhotoInPdf(excursion) && excursion.photoDataUrl ? (
            <ItemPhoto photoDataUrl={excursion.photoDataUrl} />
          ) : null}
        </View>
        <PriceColumn
          priceUsd={excursion.priceUsd}
          show={showItemPrices}
        />
      </View>
    </View>
  )
}

function TransferItem({
  transfer,
  showItemPrices,
}: {
  transfer: Transfer
  showItemPrices: boolean
}) {
  const schedule = formatCarRentalDateTime(transfer.date, transfer.time)

  return (
    <View style={pdfStyles.item} wrap={false}>
      <View style={pdfStyles.itemRow}>
        <View style={pdfStyles.itemMain}>
          <Text style={pdfStyles.itemTitle}>
            {transfer.from} → {transfer.to}
          </Text>
          {schedule ? (
            <Text style={pdfStyles.itemDetail}>
              <Text style={pdfStyles.itemDetailLabel}>Cuándo: </Text>
              {schedule}
            </Text>
          ) : null}
          {transfer.description?.trim() ? (
            <Text style={pdfStyles.itemDetail}>{transfer.description}</Text>
          ) : null}
        </View>
        <PriceColumn
          priceUsd={transfer.priceUsd}
          show={showItemPrices}
        />
      </View>
    </View>
  )
}

function ItineraryEntryItem({
  budget,
  entry,
}: {
  budget: Budget
  entry: ItineraryEntry
}) {
  switch (entry.kind) {
    case 'flight': {
      const flight = budget.flights[entry.index]
      if (!flight) {
        return null
      }
      return (
        <FlightItem
          flight={flight}
          index={entry.index}
          showItemPrices={shouldShowItemPriceInPdf(budget, flight)}
        />
      )
    }
    case 'hotel': {
      const hotel = budget.hotels[entry.index]
      if (!hotel) {
        return null
      }
      return (
        <HotelItem
          hotel={hotel}
          index={entry.index}
          showItemPrices={shouldShowItemPriceInPdf(budget, hotel)}
        />
      )
    }
    case 'excursion': {
      const excursion = budget.excursions[entry.index]
      if (!excursion) {
        return null
      }
      return (
        <ExcursionItem
          excursion={excursion}
          showItemPrices={shouldShowItemPriceInPdf(budget, excursion)}
        />
      )
    }
    case 'transfer': {
      const transfer = budget.transfers[entry.index]
      if (!transfer) {
        return null
      }
      return (
        <TransferItem
          transfer={transfer}
          showItemPrices={shouldShowItemPriceInPdf(budget, transfer)}
        />
      )
    }
    case 'carRental': {
      const rental = budget.carRentals[entry.index]
      if (!rental) {
        return null
      }
      return (
        <CarRentalItem
          rental={rental}
          index={entry.index}
          showItemPrices={shouldShowItemPriceInPdf(budget, rental)}
        />
      )
    }
    default:
      return null
  }
}

function ItinerarySection({ budget }: { budget: Budget }) {
  const items = buildItineraryRenderItems(budget)

  if (items.length === 0) {
    return null
  }

  return (
    <View style={pdfStyles.section}>
      <Text style={pdfStyles.sectionTitle}>Itinerario</Text>
      {items.map(({ entry, showDayHeading, entryDate }, index) => (
        <View key={`${entry.kind}-${entry.index}-${index}`}>
          {showDayHeading && entryDate ? (
            <Text style={pdfStyles.dayHeading}>{formatDate(entryDate)}</Text>
          ) : null}
          <ItineraryEntryItem budget={budget} entry={entry} />
        </View>
      ))}
    </View>
  )
}

function BudgetSections({ budget }: { budget: Budget }) {
  return (
    <>
      {budgetHasFlights(budget) ? (
        <View style={pdfStyles.section}>
          <Text style={pdfStyles.sectionTitle}>Vuelos</Text>
          {budget.flights.map((flight, index) => (
            <FlightItem
              key={index}
              flight={flight}
              index={index}
              showItemPrices={shouldShowItemPriceInPdf(budget, flight)}
            />
          ))}
        </View>
      ) : null}

      {budgetHasHotels(budget) ? (
        <View style={pdfStyles.section}>
          <Text style={pdfStyles.sectionTitle}>Hoteles</Text>
          {budget.hotels.map((hotel, index) => (
            <HotelItem
              key={index}
              hotel={hotel}
              index={index}
              showItemPrices={shouldShowItemPriceInPdf(budget, hotel)}
            />
          ))}
        </View>
      ) : null}

      {budgetHasExcursions(budget) ? (
        <View style={pdfStyles.section}>
          <Text style={pdfStyles.sectionTitle}>Excursiones y tickets</Text>
          {budget.excursions.map((excursion, index) => (
            <ExcursionItem
              key={index}
              excursion={excursion}
              showItemPrices={shouldShowItemPriceInPdf(budget, excursion)}
            />
          ))}
        </View>
      ) : null}

      {budgetHasTransfers(budget) ? (
        <View style={pdfStyles.section}>
          <Text style={pdfStyles.sectionTitle}>Traslados</Text>
          {budget.transfers.map((transfer, index) => (
            <TransferItem
              key={index}
              transfer={transfer}
              showItemPrices={shouldShowItemPriceInPdf(budget, transfer)}
            />
          ))}
        </View>
      ) : null}

      {budgetHasCarRentals(budget) ? (
        <View style={pdfStyles.section}>
          <Text style={pdfStyles.sectionTitle}>Alquiler de auto</Text>
          {budget.carRentals.map((rental, index) => (
            <CarRentalItem
              key={index}
              rental={rental}
              index={index}
              showItemPrices={shouldShowItemPriceInPdf(budget, rental)}
            />
          ))}
        </View>
      ) : null}
    </>
  )
}

export function BudgetPdf({ budget, logoDataUrl }: BudgetPdfProps) {
  const totalUsd = calculateBudgetTotal(budget)
  const showTotal = shouldShowPdfTotal(budget, totalUsd)

  return (
    <Document title={`Presupuesto — ${budget.destination}`}>
      <Page size="A4" style={pdfStyles.page}>
        <View style={pdfStyles.header}>
          {logoDataUrl ? (
            <View style={pdfStyles.headerRow}>
              <Image src={logoDataUrl} style={pdfStyles.logo} />
              <View style={pdfStyles.headerText}>
                <PdfHeaderTitle pdfLayout={budget.pdfLayout} />
              </View>
            </View>
          ) : (
            <PdfHeaderTitle pdfLayout={budget.pdfLayout} />
          )}
        </View>

        <View style={pdfStyles.metaRow}>
          <View style={pdfStyles.metaItem}>
            <Text style={pdfStyles.metaLabel}>Destino</Text>
            <Text style={pdfStyles.metaValue}>{budget.destination}</Text>
          </View>
          <View style={pdfStyles.metaItem}>
            <Text style={pdfStyles.metaLabel}>Fechas</Text>
            <Text style={pdfStyles.metaValue}>
              {formatDate(budget.dateFrom)} — {formatDate(budget.dateTo)}
            </Text>
          </View>
          <View style={pdfStyles.metaItem}>
            <Text style={pdfStyles.metaLabel}>Pasajeros</Text>
            <Text style={pdfStyles.metaValue}>{String(budget.passengers)}</Text>
          </View>
        </View>

        {budget.additionalInfo?.trim() ? (
          <View style={pdfStyles.additionalInfoBlock}>
            <Text style={pdfStyles.additionalInfoLabel}>
              Información adicional
            </Text>
            <Text style={pdfStyles.additionalInfoText}>
              {budget.additionalInfo.trim()}
            </Text>
          </View>
        ) : null}

        {budget.pdfLayout === 'itinerary' ? (
          <ItinerarySection budget={budget} />
        ) : (
          <BudgetSections budget={budget} />
        )}

        {budgetHasTravelAssistance(budget) ? (
          <View style={pdfStyles.section}>
            <Text style={pdfStyles.sectionTitle}>Asistencia al viajero</Text>
            <View style={pdfStyles.item} wrap={false}>
              <View style={pdfStyles.itemRow}>
                <View style={pdfStyles.itemMain}>
                  <Text style={pdfStyles.itemTitle}>
                    {budget.travelAssistance.description}
                  </Text>
                </View>
                <PriceColumn
                  priceUsd={budget.travelAssistance.priceUsd}
                  show={shouldShowItemPriceInPdf(
                    budget,
                    budget.travelAssistance,
                  )}
                />
              </View>
            </View>
          </View>
        ) : null}

        {showTotal ? (
          <View style={pdfStyles.footer}>
            <Text style={pdfStyles.footerLabel}>Total estimado:</Text>
            <Text style={pdfStyles.footerTotal}>{formatUsd(totalUsd)}</Text>
          </View>
        ) : null}

        <Text style={pdfStyles.disclaimer}>{PRICE_DISCLAIMER}</Text>
      </Page>
    </Document>
  )
}
