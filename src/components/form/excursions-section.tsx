import { Plus } from 'lucide-react'
import type { Control, FieldErrors, FieldErrorsImpl } from 'react-hook-form'
import { useFieldArray, useWatch } from 'react-hook-form'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { defaultExcursion, type BudgetFormValues } from '@/lib/schema'
import { excursionHasData } from '@/lib/row-has-data'

import { ConfirmRemoveButton } from './confirm-remove-button'
import { FieldErrorMessage } from './field-error'
import { PriceInput } from './price-input'
import { SectionEmptyState } from './section-empty-state'

type ExcursionsSectionProps = {
  control: Control<BudgetFormValues>
  errors: FieldErrors<BudgetFormValues>
  register: ReturnType<
    typeof import('react-hook-form').useForm<BudgetFormValues>
  >['register']
}

export function ExcursionsSection({
  control,
  errors,
  register,
}: ExcursionsSectionProps) {
  const { fields, append, remove } = useFieldArray({
    control,
    name: 'excursions',
  })

  return (
    <section
      className="space-y-4"
      aria-labelledby="excursions-section-title"
      role="region"
    >
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h2 id="excursions-section-title" className="text-lg font-semibold">
            Excursiones / Tickets
          </h2>
          <p className="text-sm text-foreground/80">
            Opcional — actividades y entradas.
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => append(defaultExcursion())}
        >
          <Plus className="mr-1 size-4" />
          Agregar excursión
        </Button>
      </div>

      {fields.length === 0 ? (
        <SectionEmptyState message="Sin excursiones — agregar si corresponde." />
      ) : (
        <div className="space-y-6">
          {fields.map((field, index) => (
            <ExcursionRow
              key={field.id}
              index={index}
              control={control}
              errors={errors.excursions?.[index]}
              register={register}
              onRemove={() => remove(index)}
            />
          ))}
        </div>
      )}
    </section>
  )
}

type ExcursionFieldErrors = FieldErrorsImpl<{
  name: string
  description?: string
  priceUsd?: number
}>

type ExcursionRowProps = {
  index: number
  control: Control<BudgetFormValues>
  errors?: ExcursionFieldErrors
  register: ExcursionsSectionProps['register']
  onRemove: () => void
}

function ExcursionRow({
  index,
  control,
  errors,
  register,
  onRemove,
}: ExcursionRowProps) {
  const excursionValues = useWatch({
    control,
    name: `excursions.${index}`,
  })

  return (
    <div className="space-y-4 rounded-lg border bg-muted/30 p-4">
      <div className="flex items-center justify-between gap-2">
        <h3 className="font-medium">Excursión {index + 1}</h3>
        <ConfirmRemoveButton
          itemLabel={`excursión ${index + 1}`}
          hasData={excursionValues ? excursionHasData(excursionValues) : false}
          onConfirm={onRemove}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor={`excursions.${index}.name`}>Nombre</Label>
        <Input
          id={`excursions.${index}.name`}
          placeholder="Ej. Trekking al Fitz Roy"
          aria-invalid={Boolean(errors?.name)}
          {...register(`excursions.${index}.name`)}
        />
        <FieldErrorMessage error={errors?.name} />
      </div>

      <div className="space-y-2">
        <Label htmlFor={`excursions.${index}.description`}>
          Descripción (opcional)
        </Label>
        <Textarea
          id={`excursions.${index}.description`}
          placeholder="Detalles, horarios, incluye guía, etc."
          {...register(`excursions.${index}.description`)}
        />
      </div>

      <PriceInput
        id={`excursions.${index}.priceUsd`}
        error={errors?.priceUsd}
        {...register(`excursions.${index}.priceUsd`, {
          setValueAs: (value: string) =>
            value === '' ? undefined : Number(value),
        })}
      />
    </div>
  )
}
