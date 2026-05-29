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

export function defaultBudgetValues(): BudgetFormValues {
  return {
    destination: '',
    passengers: 1,
    flights: [],
    hotels: [],
  }
}
