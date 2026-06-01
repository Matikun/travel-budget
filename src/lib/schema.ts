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

const timeOfDaySchema = z
  .string()
  .regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Indique la hora (HH:MM)')

export const flightSchema = z
  .object({
    route: z.string().min(1, 'Indique la ruta del vuelo'),
    duration: z.string().min(1, 'Indique la duración del vuelo'),
    dateFrom: z.date().optional(),
    timeFrom: timeOfDaySchema.optional(),
    dateTo: z.date().optional(),
    timeTo: timeOfDaySchema.optional(),
    description: z.string().optional(),
    type: flightTypeSchema,
    layovers: z.array(layoverSchema),
    priceUsd: optionalUsdPriceSchema,
    showPriceInPdf: z.boolean().default(true),
  })
  .superRefine((flight, ctx) => {
    if (flight.type === 'layovers' && flight.layovers.length === 0) {
      ctx.addIssue({
        code: 'custom',
        message: 'Agregue al menos una escala',
        path: ['layovers'],
      })
    }

    if (
      flight.dateFrom !== undefined &&
      flight.dateTo !== undefined &&
      flight.dateFrom > flight.dateTo
    ) {
      ctx.addIssue({
        code: 'custom',
        message:
          'La fecha de llegada debe ser posterior o igual a la de salida',
        path: ['dateTo'],
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
    showPriceInPdf: z.boolean().default(true),
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
  showPriceInPdf: z.boolean().default(true),
})

export type Excursion = z.infer<typeof excursionSchema>

export const transferSchema = z.object({
  from: z.string().min(1, 'Indique el origen del traslado'),
  to: z.string().min(1, 'Indique el destino del traslado'),
  description: z.string().optional(),
  priceUsd: optionalUsdPriceSchema,
  showPriceInPdf: z.boolean().default(true),
})

export type Transfer = z.infer<typeof transferSchema>

const carRentalTimeSchema = timeOfDaySchema

export const carRentalSchema = z
  .object({
    dateFrom: z.date({ error: 'Seleccione la fecha de retiro' }).optional(),
    dateTo: z.date({ error: 'Seleccione la fecha de devolución' }).optional(),
    timeFrom: carRentalTimeSchema.optional(),
    timeTo: carRentalTimeSchema.optional(),
    pickupLocation: z.string().min(1, 'Indique el lugar de retiro'),
    returnLocation: z.string().min(1, 'Indique el lugar de devolución'),
    description: z.string().optional(),
    priceUsd: optionalUsdPriceSchema,
    showPriceInPdf: z.boolean().default(true),
  })
  .superRefine((rental, ctx) => {
    if (rental.dateFrom === undefined) {
      ctx.addIssue({
        code: 'custom',
        message: 'Seleccione la fecha de retiro',
        path: ['dateFrom'],
      })
    }
    if (rental.dateTo === undefined) {
      ctx.addIssue({
        code: 'custom',
        message: 'Seleccione la fecha de devolución',
        path: ['dateTo'],
      })
    }
    if (!rental.timeFrom) {
      ctx.addIssue({
        code: 'custom',
        message: 'Indique la hora de retiro',
        path: ['timeFrom'],
      })
    }
    if (!rental.timeTo) {
      ctx.addIssue({
        code: 'custom',
        message: 'Indique la hora de devolución',
        path: ['timeTo'],
      })
    }
    if (
      rental.dateFrom !== undefined &&
      rental.dateTo !== undefined &&
      rental.dateFrom > rental.dateTo
    ) {
      ctx.addIssue({
        code: 'custom',
        message:
          'La fecha de retiro debe ser anterior o igual a la de devolución',
        path: ['dateTo'],
      })
    }
    if (
      rental.dateFrom !== undefined &&
      rental.dateTo !== undefined &&
      rental.timeFrom &&
      rental.timeTo &&
      rental.dateFrom.getTime() === rental.dateTo.getTime() &&
      rental.timeFrom >= rental.timeTo
    ) {
      ctx.addIssue({
        code: 'custom',
        message:
          'La hora de retiro debe ser anterior a la de devolución cuando es el mismo día',
        path: ['timeTo'],
      })
    }
  })

export type CarRental = z.infer<typeof carRentalSchema>

export const travelAssistanceSchema = z
  .object({
    enabled: z.boolean(),
    description: z.string().optional(),
    priceUsd: optionalUsdPriceSchema,
    showPriceInPdf: z.boolean().default(true),
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
  additionalInfo: z.string().optional(),
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
  carRentals: z.array(carRentalSchema),
  travelAssistance: travelAssistanceSchema,
  showTotalInPdf: z.boolean(),
  hideIndividualPricesInPdf: z.boolean().default(false),
  includeLogoInPdf: z.boolean().default(false),
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

export type BudgetFormValues = z.output<typeof budgetFormSchema>
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
    dateFrom: undefined,
    timeFrom: undefined,
    dateTo: undefined,
    timeTo: undefined,
    description: '',
    type: 'direct',
    layovers: [],
    priceUsd: undefined,
    showPriceInPdf: true,
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
    showPriceInPdf: true,
  }
}

export function defaultExcursion(): Excursion {
  return {
    name: '',
    description: '',
    priceUsd: undefined,
    showPriceInPdf: true,
  }
}

export function defaultTransfer(): Transfer {
  return {
    from: '',
    to: '',
    description: '',
    priceUsd: undefined,
    showPriceInPdf: true,
  }
}

export function defaultCarRental(): CarRental {
  return {
    dateFrom: undefined,
    dateTo: undefined,
    timeFrom: undefined,
    timeTo: undefined,
    pickupLocation: '',
    returnLocation: '',
    description: '',
    priceUsd: undefined,
    showPriceInPdf: true,
  }
}

export function defaultTravelAssistance(): TravelAssistance {
  return {
    enabled: false,
    description: '',
    priceUsd: undefined,
    showPriceInPdf: true,
  }
}

export function defaultBudgetValues(): BudgetFormValues {
  return {
    destination: '',
    additionalInfo: '',
    passengers: 1,
    flights: [],
    hotels: [],
    excursions: [],
    transfers: [],
    carRentals: [],
    travelAssistance: defaultTravelAssistance(),
    showTotalInPdf: true,
    hideIndividualPricesInPdf: false,
    includeLogoInPdf: false,
  }
}

/** Pre-filled budget for local dev / manual QA (passes validation). */
export function sampleBudgetValues(): BudgetFormValues {
  const tripStart = new Date(2026, 5, 10)
  const tripEnd = new Date(2026, 5, 17)

  return {
    destination: 'Bariloche',
    additionalInfo: 'Incluye tasas locales estimadas; confirmar antes del pago.',
    dateFrom: tripStart,
    dateTo: tripEnd,
    passengers: 2,
    flights: [
      {
        route: 'Buenos Aires (AEP) → Bariloche (BRC)',
        duration: '2h 15m',
        dateFrom: new Date(2026, 5, 10),
        timeFrom: '08:30',
        dateTo: undefined,
        timeTo: undefined,
        description: 'Vuelo ida — equipaje de mano incluido',
        type: 'direct',
        layovers: [],
        priceUsd: 285,
        showPriceInPdf: true,
      },
      {
        route: 'Bariloche (BRC) → Buenos Aires (AEP)',
        duration: '5h 40m',
        dateFrom: new Date(2026, 5, 17),
        timeFrom: '14:15',
        dateTo: undefined,
        timeTo: undefined,
        description: 'Vuelo vuelta con escala',
        type: 'layovers',
        layovers: [
          { where: 'Córdoba (COR)', duration: '1h 20m' },
        ],
        priceUsd: 310,
        showPriceInPdf: true,
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
        showPriceInPdf: true,
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
        showPriceInPdf: true,
      },
    ],
    excursions: [
      {
        name: 'Circuito Chico',
        description: 'Medio día con guía bilingüe',
        priceUsd: 65,
        showPriceInPdf: true,
      },
      {
        name: 'Cerro Catedral — ticket lift',
        description: 'Pase diario',
        priceUsd: 48,
        showPriceInPdf: true,
      },
    ],
    transfers: [
      {
        from: 'Aeropuerto BRC',
        to: 'Hotel Llao Llao',
        description: 'Traslado privado ida',
        priceUsd: 55,
        showPriceInPdf: true,
      },
    ],
    carRentals: [
      {
        dateFrom: new Date(2026, 5, 11),
        dateTo: new Date(2026, 5, 15),
        timeFrom: '10:00',
        timeTo: '18:00',
        pickupLocation: 'Aeropuerto BRC',
        returnLocation: 'Aeropuerto BRC',
        description: 'Compacto con seguro básico',
        priceUsd: 180,
        showPriceInPdf: true,
      },
    ],
    travelAssistance: {
      enabled: true,
      description: 'Asistencia al viajero 7 días — cobertura USD 50.000',
      priceUsd: 42,
      showPriceInPdf: true,
    },
    showTotalInPdf: true,
    hideIndividualPricesInPdf: false,
    includeLogoInPdf: false,
  }
}

/** Empty form in production/tests; sample data in dev for faster manual testing. */
export function initialBudgetValues(): BudgetFormValues {
  return import.meta.env.MODE === 'development'
    ? sampleBudgetValues()
    : defaultBudgetValues()
}