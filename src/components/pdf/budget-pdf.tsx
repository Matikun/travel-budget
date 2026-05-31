import {
  Document,
  Image,
  Page,
  Text,
  View,
} from '@react-pdf/renderer'

import { formatCarRentalDateTime, formatDate, formatUsd } from '@/lib/format'
import { PRICE_DISCLAIMER } from '@/lib/quote-copy'
import {
  budgetHasCarRentals,
  budgetHasExcursions,
  budgetHasFlights,
  budgetHasHotels,
  budgetHasTransfers,
  budgetHasTravelAssistance,
  shouldShowIndividualPricesInPdf,
  shouldShowPdfTotal,
} from '@/lib/pdf-helpers'
import type { Budget, CarRental, Flight, Hotel, RoomType } from '@/lib/schema'
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

function FlightItem({
  flight,
  index,
  showItemPrices,
}: {
  flight: Flight
  index: number
  showItemPrices: boolean
}) {
  return (
    <View style={pdfStyles.item} wrap={false}>
      <View style={pdfStyles.itemRow}>
        <View style={pdfStyles.itemMain}>
          <Text style={pdfStyles.itemTitle}>
            Vuelo {index + 1}: {flight.route}
          </Text>
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

function PdfHeaderTitle() {
  return (
    <>
      <Text style={pdfStyles.title}>Presupuesto de viaje</Text>
      <Text style={pdfStyles.subtitle}>
        Cotización generada para operadores
      </Text>
    </>
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
        </View>
        <PriceColumn priceUsd={hotel.priceUsd} show={showItemPrices} />
      </View>
    </View>
  )
}

export function BudgetPdf({ budget, logoDataUrl }: BudgetPdfProps) {
  const totalUsd = calculateBudgetTotal(budget)
  const showTotal = shouldShowPdfTotal(budget, totalUsd)
  const showItemPrices = shouldShowIndividualPricesInPdf(budget)

  return (
    <Document title={`Presupuesto — ${budget.destination}`}>
      <Page size="A4" style={pdfStyles.page}>
        <View style={pdfStyles.header}>
          {logoDataUrl ? (
            <View style={pdfStyles.headerRow}>
              <Image src={logoDataUrl} style={pdfStyles.logo} />
              <View style={pdfStyles.headerText}>
                <PdfHeaderTitle />
              </View>
            </View>
          ) : (
            <PdfHeaderTitle />
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

        {budgetHasFlights(budget) ? (
          <View style={pdfStyles.section}>
            <Text style={pdfStyles.sectionTitle}>Vuelos</Text>
            {budget.flights.map((flight, index) => (
              <FlightItem
                key={index}
                flight={flight}
                index={index}
                showItemPrices={showItemPrices}
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
                showItemPrices={showItemPrices}
              />
            ))}
          </View>
        ) : null}

        {budgetHasExcursions(budget) ? (
          <View style={pdfStyles.section}>
            <Text style={pdfStyles.sectionTitle}>Excursiones y tickets</Text>
            {budget.excursions.map((excursion, index) => (
              <View key={index} style={pdfStyles.item} wrap={false}>
                <View style={pdfStyles.itemRow}>
                  <View style={pdfStyles.itemMain}>
                    <Text style={pdfStyles.itemTitle}>
                      {excursion.name}
                    </Text>
                    {excursion.description?.trim() ? (
                      <Text style={pdfStyles.itemDetail}>
                        {excursion.description}
                      </Text>
                    ) : null}
                  </View>
                  <PriceColumn
                    priceUsd={excursion.priceUsd}
                    show={showItemPrices}
                  />
                </View>
              </View>
            ))}
          </View>
        ) : null}

        {budgetHasTransfers(budget) ? (
          <View style={pdfStyles.section}>
            <Text style={pdfStyles.sectionTitle}>Traslados</Text>
            {budget.transfers.map((transfer, index) => (
              <View key={index} style={pdfStyles.item} wrap={false}>
                <View style={pdfStyles.itemRow}>
                  <View style={pdfStyles.itemMain}>
                    <Text style={pdfStyles.itemTitle}>
                      {transfer.from} → {transfer.to}
                    </Text>
                    {transfer.description?.trim() ? (
                      <Text style={pdfStyles.itemDetail}>
                        {transfer.description}
                      </Text>
                    ) : null}
                  </View>
                  <PriceColumn
                    priceUsd={transfer.priceUsd}
                    show={showItemPrices}
                  />
                </View>
              </View>
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
                showItemPrices={showItemPrices}
              />
            ))}
          </View>
        ) : null}

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
                  show={showItemPrices}
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
