import { z } from 'zod'

export const flightTypeSchema = z.enum(['direct', 'layovers'])
export type FlightType = z.infer<typeof flightTypeSchema>

export const roomTypeSchema = z.enum([
  'standard',
  'double',
  'triple',
  'luxury',
])
export type RoomType = z.infer<typeof roomTypeSchema>

export const optionalUsdPriceSchema = z
  .number()
  .nonnegative('El precio no puede ser negativo')
  .optional()

export const layoverSchema = z.object({
  where: z.string().min(1, 'Indique el lugar de escala'),
  duration: z.string().min(1, 'Indique la duración de la escala'),
})

export type Layover = z.infer<typeof layoverSchema>

export const flightSchema = z
  .object({
    route: z.string().min(1, 'Indique la ruta del vuelo'),
    duration: z.string().min(1, 'Indique la duración del vuelo'),
    description: z.string().optional(),
    type: flightTypeSchema,
    layovers: z.array(layoverSchema),
    priceUsd: optionalUsdPriceSchema,
  })
  .superRefine((flight, ctx) => {
    if (flight.type === 'layovers' && flight.layovers.length === 0) {
      ctx.addIssue({
        code: 'custom',
        message: 'Agregue al menos una escala',
        path: ['layovers'],
      })
    }
  })

export type Flight = z.infer<typeof flightSchema>

export const hotelSchema = z
  .object({
    name: z.string().min(1, 'Indique el nombre del hotel'),
    dateFrom: z.date().optional(),
    dateTo: z.date().optional(),
    nights: z
      .number()
      .int('Ingrese un número entero')
      .positive('Las noches deben ser mayor a 0')
      .optional(),
    roomType: roomTypeSchema,
    breakfast: z.boolean(),
    allInclusive: z.boolean(),
    priceUsd: optionalUsdPriceSchema,
  })
  .superRefine((hotel, ctx) => {
    const hasDateRange = hotel.dateFrom !== undefined && hotel.dateTo !== undefined
    const hasNights = hotel.nights !== undefined

    if (!hasDateRange && !hasNights) {
      ctx.addIssue({
        code: 'custom',
        message: 'Indique fechas de estadía o cantidad de noches',
        path: ['nights'],
      })
    }

    if (
      hotel.dateFrom !== undefined &&
      hotel.dateTo !== undefined &&
      hotel.dateFrom > hotel.dateTo
    ) {
      ctx.addIssue({
        code: 'custom',
        message: 'La fecha de salida debe ser posterior o igual a la de entrada',
        path: ['dateTo'],
      })
    }
  })

export type Hotel = z.infer<typeof hotelSchema>

export const excursionSchema = z.object({
  name: z.string().min(1, 'Indique el nombre de la excursión o ticket'),
  description: z.string().optional(),
  priceUsd: optionalUsdPriceSchema,
})

export type Excursion = z.infer<typeof excursionSchema>

export const transferSchema = z.object({
  from: z.string().min(1, 'Indique el origen del traslado'),
  to: z.string().min(1, 'Indique el destino del traslado'),
  description: z.string().optional(),
  priceUsd: optionalUsdPriceSchema,
})

export type Transfer = z.infer<typeof transferSchema>

export const travelAssistanceSchema = z
  .object({
    enabled: z.boolean(),
    description: z.string().optional(),
    priceUsd: optionalUsdPriceSchema,
  })
  .superRefine((assistance, ctx) => {
    if (assistance.enabled && !assistance.description?.trim()) {
      ctx.addIssue({
        code: 'custom',
        message: 'Indique la descripción de la asistencia al viajero',
        path: ['description'],
      })
    }
  })

export type TravelAssistance = z.infer<typeof travelAssistanceSchema>

const budgetBaseSchema = z.object({
  destination: z.string().min(1, 'Indique el destino'),
  dateFrom: z.date({ error: 'Seleccione la fecha de inicio' }).optional(),
  dateTo: z.date({ error: 'Seleccione la fecha de fin' }).optional(),
  passengers: z
    .number()
    .int('Ingrese un número entero')
    .min(1, 'Mínimo 1 pasajero')
    .max(99, 'Máximo 99 pasajeros'),
  flights: z.array(flightSchema),
  hotels: z.array(hotelSchema),
  excursions: z.array(excursionSchema),
  transfers: z.array(transferSchema),
  travelAssistance: travelAssistanceSchema,
  showTotalInPdf: z.boolean(),
})

export const budgetFormSchema = budgetBaseSchema.superRefine((budget, ctx) => {
  if (budget.dateFrom === undefined) {
    ctx.addIssue({
      code: 'custom',
      message: 'Seleccione la fecha de inicio',
      path: ['dateFrom'],
    })
  }
  if (budget.dateTo === undefined) {
    ctx.addIssue({
      code: 'custom',
      message: 'Seleccione la fecha de fin',
      path: ['dateTo'],
    })
  }
  if (
    budget.dateFrom !== undefined &&
    budget.dateTo !== undefined &&
    budget.dateFrom > budget.dateTo
  ) {
    ctx.addIssue({
      code: 'custom',
      message:
        'La fecha de inicio debe ser anterior o igual a la fecha de fin',
      path: ['dateTo'],
    })
  }
})

/** Alias used in tests and for full parse checks. */
export const budgetSchema = budgetFormSchema

export type BudgetFormValues = z.infer<typeof budgetFormSchema>
export type Budget = Omit<BudgetFormValues, 'dateFrom' | 'dateTo'> & {
  dateFrom: Date
  dateTo: Date
}

export function defaultLayover(): Layover {
  return { where: '', duration: '' }
}

export function defaultFlight(): Flight {
  return {
    route: '',
    duration: '',
    description: '',
    type: 'direct',
    layovers: [],
    priceUsd: undefined,
  }
}

export function defaultHotel(): Hotel {
  return {
    name: '',
    dateFrom: undefined,
    dateTo: undefined,
    nights: undefined,
    roomType: 'standard',
    breakfast: false,
    allInclusive: false,
    priceUsd: undefined,
  }
}

export function defaultExcursion(): Excursion {
  return {
    name: '',
    description: '',
    priceUsd: undefined,
  }
}

export function defaultTransfer(): Transfer {
  return {
    from: '',
    to: '',
    description: '',
    priceUsd: undefined,
  }
}

export function defaultTravelAssistance(): TravelAssistance {
  return {
    enabled: false,
    description: '',
    priceUsd: undefined,
  }
}

export function defaultBudgetValues(): BudgetFormValues {
  return {
    destination: '',
    passengers: 1,
    flights: [],
    hotels: [],
    excursions: [],
    transfers: [],
    travelAssistance: defaultTravelAssistance(),
    showTotalInPdf: true,
  }
}

/** Pre-filled budget for local dev / manual QA (passes validation). */
export function sampleBudgetValues(): BudgetFormValues {
  const tripStart = new Date(2026, 5, 10)
  const tripEnd = new Date(2026, 5, 17)

  return {
    destination: 'Bariloche',
    dateFrom: tripStart,
    dateTo: tripEnd,
    passengers: 2,
    flights: [
      {
        route: 'Buenos Aires (AEP) → Bariloche (BRC)',
        duration: '2h 15m',
        description: 'Vuelo ida — equipaje de mano incluido',
        type: 'direct',
        layovers: [],
        priceUsd: 285,
      },
      {
        route: 'Bariloche (BRC) → Buenos Aires (AEP)',
        duration: '5h 40m',
        description: 'Vuelo vuelta con escala',
        type: 'layovers',
        layovers: [
          { where: 'Córdoba (COR)', duration: '1h 20m' },
        ],
        priceUsd: 310,
      },
    ],
    hotels: [
      {
        name: 'Hotel Llao Llao',
        dateFrom: new Date(2026, 5, 10),
        dateTo: new Date(2026, 5, 14),
        nights: undefined,
        roomType: 'double',
        breakfast: true,
        allInclusive: false,
        priceUsd: 890,
      },
      {
        name: 'Hostería del Cerro',
        dateFrom: undefined,
        dateTo: undefined,
        nights: 3,
        roomType: 'standard',
        breakfast: false,
        allInclusive: false,
        priceUsd: 420,
      },
    ],
    excursions: [
      {
        name: 'Circuito Chico',
        description: 'Medio día con guía bilingüe',
        priceUsd: 65,
      },
      {
        name: 'Cerro Catedral — ticket lift',
        description: 'Pase diario',
        priceUsd: 48,
      },
    ],
    transfers: [
      {
        from: 'Aeropuerto BRC',
        to: 'Hotel Llao Llao',
        description: 'Traslado privado ida',
        priceUsd: 55,
      },
    ],
    travelAssistance: {
      enabled: true,
      description: 'Asistencia al viajero 7 días — cobertura USD 50.000',
      priceUsd: 42,
    },
    showTotalInPdf: true,
  }
}

/** Empty form in production/tests; sample data in dev for faster manual testing. */
export function initialBudgetValues(): BudgetFormValues {
  return import.meta.env.MODE === 'development'
    ? sampleBudgetValues()
    : defaultBudgetValues()
}
