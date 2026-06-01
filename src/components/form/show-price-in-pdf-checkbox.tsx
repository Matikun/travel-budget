import type { Control, FieldPath } from 'react-hook-form'
import { Controller } from 'react-hook-form'

import { Checkbox } from '@/components/ui/checkbox'
import type { BudgetFormValues } from '@/lib/schema'

type ShowPriceInPdfCheckboxProps = {
  control: Control<BudgetFormValues>
  name: FieldPath<BudgetFormValues>
}

export function ShowPriceInPdfCheckbox({
  control,
  name,
}: ShowPriceInPdfCheckboxProps) {
  return (
    <Controller
      control={control}
      name={name}
      render={({ field }) => (
        <label className="flex cursor-pointer items-center gap-2 text-sm text-muted-foreground">
          <Checkbox
            checked={field.value !== false}
            onCheckedChange={(checked) => field.onChange(checked === true)}
          />
          Mostrar precio en el PDF
        </label>
      )}
    />
  )
}
