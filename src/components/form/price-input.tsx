import type { FieldError } from 'react-hook-form'

import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'

import { FieldErrorMessage } from './field-error'

type PriceInputProps = {
  id: string
  label?: string
  error?: FieldError
  className?: string
} & Omit<
  React.ComponentProps<typeof Input>,
  'type' | 'min' | 'step' | 'className'
>

export function PriceInput({
  id,
  label = 'Precio (USD)',
  error,
  className,
  ...inputProps
}: PriceInputProps) {
  return (
    <div className={cn('space-y-2', className)}>
      <Label htmlFor={id}>{label}</Label>
      <div className="relative">
        <span
          className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-foreground/65"
          aria-hidden
        >
          USD
        </span>
        <Input
          id={id}
          type="number"
          min={0}
          step="0.01"
          placeholder="Opcional"
          className="pl-12 pr-8"
          aria-invalid={Boolean(error)}
          {...inputProps}
        />
        <span
          className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm text-foreground/65"
          aria-hidden
        >
          $
        </span>
      </div>
      <FieldErrorMessage error={error} />
    </div>
  )
}
