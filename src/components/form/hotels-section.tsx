import { Plus } from 'lucide-react'
import type { Control, FieldErrors, FieldErrorsImpl } from 'react-hook-form'
import { Controller, useFieldArray, useWatch } from 'react-hook-form'

import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  defaultHotel,
  type BudgetFormValues,
  type RoomType,
} from '@/lib/schema'
import { hotelHasData } from '@/lib/row-has-data'

import { ConfirmRemoveButton } from './confirm-remove-button'
import { DatePickerField } from './date-picker-field'
import { FieldErrorMessage } from './field-error'
import { PriceInput } from './price-input'
import { SectionEmptyState } from './section-empty-state'

const ROOM_TYPE_LABELS: Record<RoomType, string> = {
  standard: 'Estándar',
  double: 'Doble',
  triple: 'Triple',
  luxury: 'Lujo',
}

type HotelsSectionProps = {
  control: Control<BudgetFormValues>
  errors: FieldErrors<BudgetFormValues>
  register: ReturnType<
    typeof import('react-hook-form').useForm<BudgetFormValues>
  >['register']
}

export function HotelsSection({
  control,
  errors,
  register,
}: HotelsSectionProps) {
  const { fields, append, remove } = useFieldArray({
    control,
    name: 'hotels',
  })

  return (
    <section
      className="space-y-4"
      aria-labelledby="hotels-section-title"
      role="region"
    >
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h2
            id="hotels-section-title"
            className="text-base font-semibold tracking-tight"
          >
            Hoteles
          </h2>
          <p className="text-sm text-muted-foreground">
            Opcional — agregue alojamientos si corresponde.
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => append(defaultHotel())}
        >
          <Plus className="mr-1 size-4" />
          Agregar hotel
        </Button>
      </div>

      {fields.length === 0 ? (
        <SectionEmptyState message="Sin hoteles — agregar si corresponde." />
      ) : (
        <div className="space-y-6">
          {fields.map((field, index) => (
            <HotelRow
              key={field.id}
              index={index}
              control={control}
              errors={errors.hotels?.[index]}
              register={register}
              onRemove={() => remove(index)}
            />
          ))}
        </div>
      )}
    </section>
  )
}

type HotelFieldErrors = FieldErrorsImpl<{
  name: string
  roomType: RoomType
  breakfast: boolean
  allInclusive: boolean
  dateFrom?: Date
  dateTo?: Date
  nights?: number
  priceUsd?: number
}>

type HotelRowProps = {
  index: number
  control: Control<BudgetFormValues>
  errors?: HotelFieldErrors
  register: HotelsSectionProps['register']
  onRemove: () => void
}

function HotelRow({ index, control, errors, register, onRemove }: HotelRowProps) {
  const hotelValues = useWatch({
    control,
    name: `hotels.${index}`,
  })

  return (
    <div className="space-y-4 rounded-lg border bg-muted/30 p-4">
      <div className="flex items-center justify-between gap-2">
        <h3 className="font-medium">Hotel {index + 1}</h3>
        <ConfirmRemoveButton
          itemLabel={`hotel ${index + 1}`}
          hasData={hotelValues ? hotelHasData(hotelValues) : false}
          onConfirm={onRemove}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor={`hotels.${index}.name`}>Nombre</Label>
        <Input
          id={`hotels.${index}.name`}
          placeholder="Ej. Hotel Patagonia"
          aria-invalid={Boolean(errors?.name)}
          {...register(`hotels.${index}.name`)}
        />
        <FieldErrorMessage error={errors?.name} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Controller
          control={control}
          name={`hotels.${index}.dateFrom`}
          render={({ field }) => (
            <DatePickerField
              id={`hotels.${index}.dateFrom`}
              label="Check-in (opcional)"
              value={field.value}
              onChange={field.onChange}
              error={errors?.dateFrom}
              placeholder="Fecha de entrada"
            />
          )}
        />
        <Controller
          control={control}
          name={`hotels.${index}.dateTo`}
          render={({ field }) => (
            <DatePickerField
              id={`hotels.${index}.dateTo`}
              label="Check-out (opcional)"
              value={field.value}
              onChange={field.onChange}
              error={errors?.dateTo}
              placeholder="Fecha de salida"
            />
          )}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor={`hotels.${index}.nights`}>
          Noches (si no usa fechas)
        </Label>
        <Input
          id={`hotels.${index}.nights`}
          type="number"
          min={1}
          placeholder="Ej. 5"
          aria-invalid={Boolean(errors?.nights)}
          {...register(`hotels.${index}.nights`, {
            setValueAs: (value: string) =>
              value === '' ? undefined : Number(value),
          })}
        />
        <FieldErrorMessage error={errors?.nights} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor={`hotels.${index}.roomType`}>Tipo de habitación</Label>
          <Controller
            control={control}
            name={`hotels.${index}.roomType`}
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger
                  id={`hotels.${index}.roomType`}
                  className="w-full"
                  aria-invalid={Boolean(errors?.roomType)}
                >
                  <SelectValue placeholder="Seleccionar tipo" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(ROOM_TYPE_LABELS).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
          <FieldErrorMessage error={errors?.roomType} />
        </div>

        <PriceInput
          id={`hotels.${index}.priceUsd`}
          error={errors?.priceUsd}
          {...register(`hotels.${index}.priceUsd`, {
            setValueAs: (value: string) =>
              value === '' ? undefined : Number(value),
          })}
        />
      </div>

      <div className="flex flex-wrap gap-6">
        <Controller
          control={control}
          name={`hotels.${index}.breakfast`}
          render={({ field }) => (
            <label className="flex cursor-pointer items-center gap-2 text-sm">
              <Checkbox
                checked={field.value}
                onCheckedChange={(checked) => field.onChange(checked === true)}
              />
              Desayuno incluido
            </label>
          )}
        />
        <Controller
          control={control}
          name={`hotels.${index}.allInclusive`}
          render={({ field }) => (
            <label className="flex cursor-pointer items-center gap-2 text-sm">
              <Checkbox
                checked={field.value}
                onCheckedChange={(checked) => field.onChange(checked === true)}
              />
              All inclusive
            </label>
          )}
        />
      </div>
    </div>
  )
}
