import { Plus } from 'lucide-react'
import type { Control, FieldErrors, FieldErrorsImpl } from 'react-hook-form'
import { Controller, useFieldArray, useWatch } from 'react-hook-form'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { defaultCarRental, type BudgetFormValues } from '@/lib/schema'
import { carRentalHasData } from '@/lib/row-has-data'

import { ConfirmRemoveButton } from './confirm-remove-button'
import { DatePickerField } from './date-picker-field'
import { FieldErrorMessage } from './field-error'
import { PriceInput } from './price-input'
import { SectionEmptyState } from './section-empty-state'

type CarRentalsSectionProps = {
  control: Control<BudgetFormValues>
  errors: FieldErrors<BudgetFormValues>
  register: ReturnType<
    typeof import('react-hook-form').useForm<BudgetFormValues>
  >['register']
}

export function CarRentalsSection({
  control,
  errors,
  register,
}: CarRentalsSectionProps) {
  const { fields, append, remove } = useFieldArray({
    control,
    name: 'carRentals',
  })

  return (
    <section
      className="space-y-4"
      aria-labelledby="car-rentals-section-title"
      role="region"
    >
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h2
            id="car-rentals-section-title"
            className="text-base font-semibold tracking-tight"
          >
            Alquiler de auto
          </h2>
          <p className="text-sm text-muted-foreground">
            Opcional — alquiler de vehículo durante el viaje.
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => append(defaultCarRental())}
        >
          <Plus className="mr-1 size-4" />
          Agregar alquiler
        </Button>
      </div>

      {fields.length === 0 ? (
        <SectionEmptyState message="Sin alquiler de auto — agregar si corresponde." />
      ) : (
        <div className="space-y-6">
          {fields.map((field, index) => (
            <CarRentalRow
              key={field.id}
              index={index}
              control={control}
              errors={errors.carRentals?.[index]}
              register={register}
              onRemove={() => remove(index)}
            />
          ))}
        </div>
      )}
    </section>
  )
}

type CarRentalFieldErrors = FieldErrorsImpl<{
  dateFrom?: Date
  dateTo?: Date
  pickupLocation: string
  returnLocation: string
  description?: string
  priceUsd?: number
}>

type CarRentalRowProps = {
  index: number
  control: Control<BudgetFormValues>
  errors?: CarRentalFieldErrors
  register: CarRentalsSectionProps['register']
  onRemove: () => void
}

function CarRentalRow({
  index,
  control,
  errors,
  register,
  onRemove,
}: CarRentalRowProps) {
  const carRentalValues = useWatch({
    control,
    name: `carRentals.${index}`,
  })

  return (
    <div className="space-y-4 rounded-lg border bg-muted/30 p-4">
      <div className="flex items-center justify-between gap-2">
        <h3 className="font-medium">Alquiler {index + 1}</h3>
        <ConfirmRemoveButton
          itemLabel={`alquiler ${index + 1}`}
          hasData={carRentalValues ? carRentalHasData(carRentalValues) : false}
          onConfirm={onRemove}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Controller
          control={control}
          name={`carRentals.${index}.dateFrom`}
          render={({ field }) => (
            <DatePickerField
              id={`carRentals.${index}.dateFrom`}
              label="Fecha desde"
              value={field.value}
              onChange={field.onChange}
              error={errors?.dateFrom}
              placeholder="Retiro del vehículo"
            />
          )}
        />
        <Controller
          control={control}
          name={`carRentals.${index}.dateTo`}
          render={({ field }) => (
            <DatePickerField
              id={`carRentals.${index}.dateTo`}
              label="Fecha hasta"
              value={field.value}
              onChange={field.onChange}
              error={errors?.dateTo}
              placeholder="Devolución del vehículo"
            />
          )}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor={`carRentals.${index}.pickupLocation`}>
            Retira en (lugar)
          </Label>
          <Input
            id={`carRentals.${index}.pickupLocation`}
            placeholder="Ej. Aeropuerto"
            aria-invalid={Boolean(errors?.pickupLocation)}
            {...register(`carRentals.${index}.pickupLocation`)}
          />
          <FieldErrorMessage error={errors?.pickupLocation} />
        </div>
        <div className="space-y-2">
          <Label htmlFor={`carRentals.${index}.returnLocation`}>
            Devuelve en (lugar)
          </Label>
          <Input
            id={`carRentals.${index}.returnLocation`}
            placeholder="Ej. Oficina centro"
            aria-invalid={Boolean(errors?.returnLocation)}
            {...register(`carRentals.${index}.returnLocation`)}
          />
          <FieldErrorMessage error={errors?.returnLocation} />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor={`carRentals.${index}.description`}>
          Descripción (opcional)
        </Label>
        <Textarea
          id={`carRentals.${index}.description`}
          placeholder="Tipo de vehículo, seguro, etc."
          {...register(`carRentals.${index}.description`)}
        />
      </div>

      <PriceInput
        id={`carRentals.${index}.priceUsd`}
        error={errors?.priceUsd}
        {...register(`carRentals.${index}.priceUsd`, {
          setValueAs: (value: string) =>
            value === '' ? undefined : Number(value),
        })}
      />
    </div>
  )
}
