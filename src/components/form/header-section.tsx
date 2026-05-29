import type { Control, FieldErrors } from 'react-hook-form'
import { Controller } from 'react-hook-form'

import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import type { BudgetFormValues } from '@/lib/schema'

import { DatePickerField } from './date-picker-field'
import { FieldErrorMessage } from './field-error'

type HeaderSectionProps = {
  control: Control<BudgetFormValues>
  errors: FieldErrors<BudgetFormValues>
  register: ReturnType<
    typeof import('react-hook-form').useForm<BudgetFormValues>
  >['register']
}

export function HeaderSection({
  control,
  errors,
  register,
}: HeaderSectionProps) {
  return (
    <section className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold">Datos del viaje</h2>
        <p className="text-sm text-muted-foreground">
          Información general del presupuesto.
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="destination">Destino</Label>
        <Input
          id="destination"
          placeholder="Ej. Bariloche"
          aria-invalid={Boolean(errors.destination)}
          {...register('destination')}
        />
        <FieldErrorMessage error={errors.destination} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Controller
          control={control}
          name="dateFrom"
          render={({ field }) => (
            <DatePickerField
              id="dateFrom"
              label="Fecha de inicio"
              value={field.value}
              onChange={field.onChange}
              error={errors.dateFrom}
            />
          )}
        />
        <Controller
          control={control}
          name="dateTo"
          render={({ field }) => (
            <DatePickerField
              id="dateTo"
              label="Fecha de fin"
              value={field.value}
              onChange={field.onChange}
              error={errors.dateTo}
            />
          )}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="passengers">Cantidad de pasajeros</Label>
        <Input
          id="passengers"
          type="number"
          min={1}
          max={99}
          aria-invalid={Boolean(errors.passengers)}
          {...register('passengers', { valueAsNumber: true })}
        />
        <FieldErrorMessage error={errors.passengers} />
      </div>
    </section>
  )
}
