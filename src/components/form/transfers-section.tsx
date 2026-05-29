import { Plus } from 'lucide-react'
import type { Control, FieldErrors, FieldErrorsImpl } from 'react-hook-form'
import { useFieldArray, useWatch } from 'react-hook-form'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { defaultTransfer, type BudgetFormValues } from '@/lib/schema'
import { transferHasData } from '@/lib/row-has-data'

import { ConfirmRemoveButton } from './confirm-remove-button'
import { FieldErrorMessage } from './field-error'
import { PriceInput } from './price-input'
import { SectionEmptyState } from './section-empty-state'

type TransfersSectionProps = {
  control: Control<BudgetFormValues>
  errors: FieldErrors<BudgetFormValues>
  register: ReturnType<
    typeof import('react-hook-form').useForm<BudgetFormValues>
  >['register']
}

export function TransfersSection({
  control,
  errors,
  register,
}: TransfersSectionProps) {
  const { fields, append, remove } = useFieldArray({
    control,
    name: 'transfers',
  })

  return (
    <section
      className="space-y-4"
      aria-labelledby="transfers-section-title"
      role="region"
    >
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h2 id="transfers-section-title" className="text-lg font-semibold">
            Traslados
          </h2>
          <p className="text-sm text-muted-foreground">
            Opcional — traslados entre puntos del viaje.
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => append(defaultTransfer())}
        >
          <Plus className="mr-1 size-4" />
          Agregar traslado
        </Button>
      </div>

      {fields.length === 0 ? (
        <SectionEmptyState message="Sin traslados — agregar si corresponde." />
      ) : (
        <div className="space-y-6">
          {fields.map((field, index) => (
            <TransferRow
              key={field.id}
              index={index}
              control={control}
              errors={errors.transfers?.[index]}
              register={register}
              onRemove={() => remove(index)}
            />
          ))}
        </div>
      )}
    </section>
  )
}

type TransferFieldErrors = FieldErrorsImpl<{
  from: string
  to: string
  description?: string
  priceUsd?: number
}>

type TransferRowProps = {
  index: number
  control: Control<BudgetFormValues>
  errors?: TransferFieldErrors
  register: TransfersSectionProps['register']
  onRemove: () => void
}

function TransferRow({
  index,
  control,
  errors,
  register,
  onRemove,
}: TransferRowProps) {
  const transferValues = useWatch({
    control,
    name: `transfers.${index}`,
  })

  return (
    <div className="space-y-4 rounded-lg border bg-muted/30 p-4">
      <div className="flex items-center justify-between gap-2">
        <h3 className="font-medium">Traslado {index + 1}</h3>
        <ConfirmRemoveButton
          itemLabel={`traslado ${index + 1}`}
          hasData={transferValues ? transferHasData(transferValues) : false}
          onConfirm={onRemove}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor={`transfers.${index}.from`}>Desde</Label>
          <Input
            id={`transfers.${index}.from`}
            placeholder="Ej. Aeropuerto"
            aria-invalid={Boolean(errors?.from)}
            {...register(`transfers.${index}.from`)}
          />
          <FieldErrorMessage error={errors?.from} />
        </div>
        <div className="space-y-2">
          <Label htmlFor={`transfers.${index}.to`}>Hasta</Label>
          <Input
            id={`transfers.${index}.to`}
            placeholder="Ej. Hotel centro"
            aria-invalid={Boolean(errors?.to)}
            {...register(`transfers.${index}.to`)}
          />
          <FieldErrorMessage error={errors?.to} />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor={`transfers.${index}.description`}>
          Descripción (opcional)
        </Label>
        <Textarea
          id={`transfers.${index}.description`}
          placeholder="Tipo de vehículo, horario, etc."
          {...register(`transfers.${index}.description`)}
        />
      </div>

      <PriceInput
        id={`transfers.${index}.priceUsd`}
        error={errors?.priceUsd}
        {...register(`transfers.${index}.priceUsd`, {
          setValueAs: (value: string) =>
            value === '' ? undefined : Number(value),
        })}
      />
    </div>
  )
}
