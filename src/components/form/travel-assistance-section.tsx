import type { Control, FieldErrors } from 'react-hook-form'
import { Controller } from 'react-hook-form'

import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import type { BudgetFormValues } from '@/lib/schema'

import { FieldErrorMessage } from './field-error'
import { PriceInput } from './price-input'

type TravelAssistanceSectionProps = {
  control: Control<BudgetFormValues>
  errors: FieldErrors<BudgetFormValues>
  register: ReturnType<
    typeof import('react-hook-form').useForm<BudgetFormValues>
  >['register']
}

export function TravelAssistanceSection({
  control,
  errors,
  register,
}: TravelAssistanceSectionProps) {
  const assistanceErrors = errors.travelAssistance

  return (
    <section
      className="space-y-4"
      aria-labelledby="travel-assistance-section-title"
      role="region"
    >
      <div>
        <h2
          id="travel-assistance-section-title"
          className="text-lg font-semibold"
        >
          Asistencia al viajero
        </h2>
        <p className="text-sm text-muted-foreground">
          Opcional — cobertura o seguro de viaje.
        </p>
      </div>

      <Controller
        control={control}
        name="travelAssistance.enabled"
        render={({ field }) => (
          <label className="flex cursor-pointer items-center gap-2 text-sm font-medium">
            <Checkbox
              checked={field.value}
              onCheckedChange={(checked) => field.onChange(checked === true)}
            />
            Incluir asistencia al viajero
          </label>
        )}
      />

      <Controller
        control={control}
        name="travelAssistance.enabled"
        render={({ field: enabledField }) =>
          enabledField.value ? (
            <div className="space-y-4 rounded-lg border bg-muted/30 p-4">
              <div className="space-y-2">
                <Label htmlFor="travelAssistance.description">
                  Descripción
                </Label>
                <Textarea
                  id="travelAssistance.description"
                  placeholder="Ej. Cobertura médica internacional, cancelación, etc."
                  aria-invalid={Boolean(assistanceErrors?.description)}
                  {...register('travelAssistance.description')}
                />
                <FieldErrorMessage error={assistanceErrors?.description} />
              </div>

              <PriceInput
                id="travelAssistance.priceUsd"
                error={assistanceErrors?.priceUsd}
                {...register('travelAssistance.priceUsd', {
                  setValueAs: (value: string) =>
                    value === '' ? undefined : Number(value),
                })}
              />
            </div>
          ) : (
            <p className="text-sm text-muted-foreground" role="status">
              Sin asistencia — marque la casilla para agregar si corresponde.
            </p>
          )
        }
      />
    </section>
  )
}
