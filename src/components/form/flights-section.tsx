import { Plus } from 'lucide-react'
import type { Control, FieldErrors, FieldErrorsImpl } from 'react-hook-form'
import { Controller, useFieldArray, useWatch } from 'react-hook-form'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { Textarea } from '@/components/ui/textarea'
import {
  defaultFlight,
  defaultLayover,
  type BudgetFormValues,
  type FlightType,
} from '@/lib/schema'
import { flightHasData, layoverHasData } from '@/lib/row-has-data'

import { ConfirmRemoveButton } from './confirm-remove-button'
import { FieldErrorMessage } from './field-error'
import { PriceInput } from './price-input'
import { SectionEmptyState } from './section-empty-state'

const FLIGHT_TYPE_LABELS: Record<FlightType, string> = {
  direct: 'Directo',
  layovers: 'Con escalas',
}

type FlightsSectionProps = {
  control: Control<BudgetFormValues>
  errors: FieldErrors<BudgetFormValues>
  register: ReturnType<
    typeof import('react-hook-form').useForm<BudgetFormValues>
  >['register']
}

export function FlightsSection({
  control,
  errors,
  register,
}: FlightsSectionProps) {
  const { fields, append, remove } = useFieldArray({
    control,
    name: 'flights',
  })

  return (
    <section
      className="space-y-4"
      aria-labelledby="flights-section-title"
      role="region"
    >
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h2 id="flights-section-title" className="text-lg font-semibold">
            Vuelos
          </h2>
          <p className="text-sm text-muted-foreground">
            Opcional — agregue vuelos si corresponde.
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => append(defaultFlight())}
        >
          <Plus className="mr-1 size-4" />
          Agregar vuelo
        </Button>
      </div>

      {fields.length === 0 ? (
        <SectionEmptyState message="Sin vuelos — agregar si corresponde." />
      ) : (
        <div className="space-y-6">
          {fields.map((field, index) => (
            <FlightRow
              key={field.id}
              index={index}
              control={control}
              errors={errors.flights?.[index]}
              register={register}
              onRemove={() => remove(index)}
            />
          ))}
        </div>
      )}
    </section>
  )
}

type FlightFieldErrors = FieldErrorsImpl<{
  route: string
  duration: string
  type: FlightType
  layovers: { where: string; duration: string }[]
  description?: string
  priceUsd?: number
}>

type FlightRowProps = {
  index: number
  control: Control<BudgetFormValues>
  errors?: FlightFieldErrors
  register: FlightsSectionProps['register']
  onRemove: () => void
}

function FlightRow({
  index,
  control,
  errors,
  register,
  onRemove,
}: FlightRowProps) {
  const layoversArray = useFieldArray({
    control,
    name: `flights.${index}.layovers`,
  })
  const flightType = useWatch({
    control,
    name: `flights.${index}.type`,
  })
  const flightValues = useWatch({
    control,
    name: `flights.${index}`,
  })
  const itemLabel = `vuelo ${index + 1}`

  return (
    <div className="space-y-4 rounded-lg border bg-muted/30 p-4">
      <div className="flex items-center justify-between gap-2">
        <h3 className="font-medium">Vuelo {index + 1}</h3>
        <ConfirmRemoveButton
          itemLabel={itemLabel}
          hasData={flightValues ? flightHasData(flightValues) : false}
          onConfirm={onRemove}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor={`flights.${index}.route`}>Ruta</Label>
          <Input
            id={`flights.${index}.route`}
            placeholder="Ej. EZE → BRC"
            aria-invalid={Boolean(errors?.route)}
            {...register(`flights.${index}.route`)}
          />
          <FieldErrorMessage error={errors?.route} />
        </div>

        <div className="space-y-2">
          <Label htmlFor={`flights.${index}.duration`}>Duración</Label>
          <Input
            id={`flights.${index}.duration`}
            placeholder="Ej. 2h 15m"
            aria-invalid={Boolean(errors?.duration)}
            {...register(`flights.${index}.duration`)}
          />
          <FieldErrorMessage error={errors?.duration} />
        </div>

        <PriceInput
          id={`flights.${index}.priceUsd`}
          error={errors?.priceUsd}
          {...register(`flights.${index}.priceUsd`, {
            setValueAs: (value: string) =>
              value === '' ? undefined : Number(value),
          })}
        />

        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor={`flights.${index}.description`}>
            Descripción (opcional)
          </Label>
          <Textarea
            id={`flights.${index}.description`}
            placeholder="Detalles del vuelo, equipaje, etc."
            {...register(`flights.${index}.description`)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor={`flights.${index}.type`}>Tipo de vuelo</Label>
          <Controller
            control={control}
            name={`flights.${index}.type`}
            render={({ field }) => (
              <Select
                value={field.value}
                onValueChange={(value: FlightType) => {
                  field.onChange(value)
                  if (value === 'layovers' && layoversArray.fields.length === 0) {
                    layoversArray.append(defaultLayover())
                  }
                  if (value === 'direct') {
                    layoversArray.replace([])
                  }
                }}
              >
                <SelectTrigger
                  id={`flights.${index}.type`}
                  className="w-full"
                  aria-invalid={Boolean(errors?.type)}
                >
                  <SelectValue placeholder="Seleccionar tipo" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(FLIGHT_TYPE_LABELS).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
          <FieldErrorMessage error={errors?.type} />
        </div>
      </div>

      {flightType === 'layovers' ? (
        <div className="space-y-3">
          <Separator />
          <div className="flex items-center justify-between gap-2">
            <h4 className="text-sm font-medium">Escalas</h4>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => layoversArray.append(defaultLayover())}
            >
              <Plus className="mr-1 size-4" />
              Agregar escala
            </Button>
          </div>

          {layoversArray.fields.length === 0 ? (
            <FieldErrorMessage
              error={
                Array.isArray(errors?.layovers)
                  ? undefined
                  : (errors?.layovers as { message?: string } | undefined)
              }
            />
          ) : (
            <div className="space-y-3">
              {layoversArray.fields.map((layover, layoverIndex) => {
                const layoverValues = flightValues?.layovers?.[layoverIndex]
                return (
                <div
                  key={layover.id}
                  className="grid gap-3 rounded-md border bg-background p-3 sm:grid-cols-[1fr_1fr_auto]"
                >
                  <div className="space-y-2">
                    <Label
                      htmlFor={`flights.${index}.layovers.${layoverIndex}.where`}
                    >
                      Lugar
                    </Label>
                    <Input
                      id={`flights.${index}.layovers.${layoverIndex}.where`}
                      placeholder="Ej. Santiago"
                      aria-invalid={Boolean(
                        errors?.layovers?.[layoverIndex]?.where,
                      )}
                      {...register(
                        `flights.${index}.layovers.${layoverIndex}.where`,
                      )}
                    />
                    <FieldErrorMessage
                      error={errors?.layovers?.[layoverIndex]?.where}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label
                      htmlFor={`flights.${index}.layovers.${layoverIndex}.duration`}
                    >
                      Duración
                    </Label>
                    <Input
                      id={`flights.${index}.layovers.${layoverIndex}.duration`}
                      placeholder="Ej. 1h 30m"
                      aria-invalid={Boolean(
                        errors?.layovers?.[layoverIndex]?.duration,
                      )}
                      {...register(
                        `flights.${index}.layovers.${layoverIndex}.duration`,
                      )}
                    />
                    <FieldErrorMessage
                      error={errors?.layovers?.[layoverIndex]?.duration}
                    />
                  </div>
                  <div className="flex items-end">
                    <ConfirmRemoveButton
                      itemLabel={`escala ${layoverIndex + 1} del ${itemLabel}`}
                      hasData={
                        layoverValues ? layoverHasData(layoverValues) : false
                      }
                      onConfirm={() => layoversArray.remove(layoverIndex)}
                      disabled={layoversArray.fields.length <= 1}
                      iconOnly
                    />
                  </div>
                </div>
              )})}
            </div>
          )}
        </div>
      ) : null}
    </div>
  )
}
