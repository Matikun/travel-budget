import {
  Document,
  Page,
  Text,
  View,
} from '@react-pdf/renderer'

import { formatDate, formatUsd } from '@/lib/format'
import {
  budgetHasExcursions,
  budgetHasFlights,
  budgetHasHotels,
  budgetHasTransfers,
  budgetHasTravelAssistance,
  shouldShowPdfTotal,
} from '@/lib/pdf-helpers'
import type { Budget, Flight, Hotel, RoomType } from '@/lib/schema'
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
}

function PriceColumn({ priceUsd }: { priceUsd?: number }) {
  if (priceUsd === undefined || priceUsd === null) {
    return null
  }

  return <Text style={pdfStyles.itemPrice}>{formatUsd(priceUsd)}</Text>
}

function FlightItem({ flight, index }: { flight: Flight; index: number }) {
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
        <PriceColumn priceUsd={flight.priceUsd} />
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

function HotelItem({ hotel, index }: { hotel: Hotel; index: number }) {
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
        <PriceColumn priceUsd={hotel.priceUsd} />
      </View>
    </View>
  )
}

export function BudgetPdf({ budget }: BudgetPdfProps) {
  const totalUsd = calculateBudgetTotal(budget)
  const showTotal = shouldShowPdfTotal(budget, totalUsd)

  return (
    <Document title={`Presupuesto — ${budget.destination}`}>
      <Page size="A4" style={pdfStyles.page}>
        <Text style={pdfStyles.title}>Presupuesto de viaje</Text>
        <Text style={pdfStyles.subtitle}>
          Cotización generada para operadores
        </Text>

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
            <Text style={pdfStyles.metaValue}>{budget.passengers}</Text>
          </View>
        </View>

        {budgetHasFlights(budget) ? (
          <View style={pdfStyles.section}>
            <Text style={pdfStyles.sectionTitle}>Vuelos</Text>
            {budget.flights.map((flight, index) => (
              <FlightItem key={index} flight={flight} index={index} />
            ))}
          </View>
        ) : null}

        {budgetHasHotels(budget) ? (
          <View style={pdfStyles.section}>
            <Text style={pdfStyles.sectionTitle}>Hoteles</Text>
            {budget.hotels.map((hotel, index) => (
              <HotelItem key={index} hotel={hotel} index={index} />
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
                  <PriceColumn priceUsd={excursion.priceUsd} />
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
                  <PriceColumn priceUsd={transfer.priceUsd} />
                </View>
              </View>
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
                <PriceColumn priceUsd={budget.travelAssistance.priceUsd} />
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
      </Page>
    </Document>
  )
}
