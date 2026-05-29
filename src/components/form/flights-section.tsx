import { Plus, Trash2 } from 'lucide-react'
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

import { FieldErrorMessage } from './field-error'

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
    <section className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h2 className="text-lg font-semibold">Vuelos</h2>
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
        <p className="rounded-md border border-dashed px-4 py-6 text-center text-sm text-muted-foreground">
          Sin vuelos cargados.
        </p>
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

  return (
    <div className="space-y-4 rounded-lg border bg-muted/30 p-4">
      <div className="flex items-center justify-between gap-2">
        <h3 className="font-medium">Vuelo {index + 1}</h3>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={onRemove}
          className="text-destructive hover:text-destructive"
        >
          <Trash2 className="mr-1 size-4" />
          Quitar
        </Button>
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

        <div className="space-y-2">
          <Label htmlFor={`flights.${index}.priceUsd`}>Precio (USD)</Label>
          <Input
            id={`flights.${index}.priceUsd`}
            type="number"
            min={0}
            step="0.01"
            placeholder="Opcional"
            aria-invalid={Boolean(errors?.priceUsd)}
            {...register(`flights.${index}.priceUsd`, {
              setValueAs: (value: string) =>
                value === '' ? undefined : Number(value),
            })}
          />
          <FieldErrorMessage error={errors?.priceUsd} />
        </div>

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
              {layoversArray.fields.map((layover, layoverIndex) => (
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
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => layoversArray.remove(layoverIndex)}
                      disabled={layoversArray.fields.length <= 1}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : null}
    </div>
  )
}
