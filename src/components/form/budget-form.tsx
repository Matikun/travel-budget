import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { useForm } from 'react-hook-form'

import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import {
  budgetFormSchema,
  defaultBudgetValues,
  type Budget,
  type BudgetFormValues,
} from '@/lib/schema'

import { EstimatedTotalBar } from './estimated-total-bar'
import { ExcursionsSection } from './excursions-section'
import { FlightsSection } from './flights-section'
import { HeaderSection } from './header-section'
import { HotelsSection } from './hotels-section'
import { TransfersSection } from './transfers-section'
import { TravelAssistanceSection } from './travel-assistance-section'

export function BudgetForm() {
  const [lastSubmitted, setLastSubmitted] = useState<Budget | null>(null)

  const {
    control,
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<BudgetFormValues>({
    resolver: zodResolver(budgetFormSchema),
    defaultValues: defaultBudgetValues(),
    mode: 'onSubmit',
  })

  const onSubmit = (data: BudgetFormValues) => {
    if (!data.dateFrom || !data.dateTo) {
      return
    }
    setLastSubmitted({
      ...data,
      dateFrom: data.dateFrom,
      dateTo: data.dateTo,
    })
  }

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="mx-auto flex w-full max-w-3xl flex-col gap-6 p-4 pb-28 sm:p-6"
      noValidate
    >
      <Card>
        <CardHeader>
          <CardTitle>Presupuesto de viaje</CardTitle>
          <CardDescription>
            Complete los datos del viaje. Vuelos y hoteles son opcionales.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-8">
          <HeaderSection
            control={control}
            errors={errors}
            register={register}
          />
          <Separator />
          <FlightsSection
            control={control}
            errors={errors}
            register={register}
          />
          <Separator />
          <HotelsSection control={control} errors={errors} register={register} />
          <Separator />
          <ExcursionsSection
            control={control}
            errors={errors}
            register={register}
          />
          <Separator />
          <TransfersSection
            control={control}
            errors={errors}
            register={register}
          />
          <Separator />
          <TravelAssistanceSection
            control={control}
            errors={errors}
            register={register}
          />
          <Separator />
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-muted-foreground">
              La generación de PDF estará disponible en la Fase 3.
            </p>
            <Button type="submit" disabled={isSubmitting}>
              Validar presupuesto
            </Button>
          </div>
          {lastSubmitted ? (
            <output
              className="rounded-md border border-green-600/30 bg-green-50 px-4 py-3 text-sm text-green-900 dark:bg-green-950/30 dark:text-green-100"
              aria-live="polite"
            >
              Presupuesto válido para{' '}
              <strong>{lastSubmitted.destination}</strong> —{' '}
              {lastSubmitted.flights.length} vuelo(s),{' '}
              {lastSubmitted.hotels.length} hotel(es),{' '}
              {lastSubmitted.excursions.length} excursión(es),{' '}
              {lastSubmitted.transfers.length} traslado(s).
            </output>
          ) : null}
        </CardContent>
      </Card>
      <EstimatedTotalBar control={control} />
    </form>
  )
}
