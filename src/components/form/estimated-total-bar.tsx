import type { Control } from 'react-hook-form'
import { Controller, useWatch } from 'react-hook-form'

import { Checkbox } from '@/components/ui/checkbox'
import { formatUsd } from '@/lib/format'
import type { BudgetFormValues } from '@/lib/schema'
import { calculateBudgetTotal } from '@/lib/totals'

type EstimatedTotalBarProps = {
  control: Control<BudgetFormValues>
}

export function EstimatedTotalBar({ control }: EstimatedTotalBarProps) {
  const watched = useWatch({ control })
  const total = calculateBudgetTotal(watched)

  return (
    <div className="sticky bottom-0 z-10 -mx-4 border-t bg-background/95 px-4 py-3 backdrop-blur supports-[backdrop-filter]:bg-background/80 sm:-mx-6 sm:px-6">
      <div className="flex flex-col gap-3 rounded-xl border border-primary/25 bg-card px-4 py-3.5 shadow-md dark:border-primary/35 dark:shadow-lg dark:shadow-black/30 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-lg font-semibold tabular-nums tracking-tight">
          Total estimado:{' '}
          <span className="text-primary">{formatUsd(total)}</span>
        </p>
        <div className="flex flex-col gap-2 sm:items-end">
          <Controller
            control={control}
            name="showTotalInPdf"
            render={({ field }) => (
              <label className="flex cursor-pointer items-center gap-2 text-sm text-muted-foreground">
                <Checkbox
                  checked={field.value}
                  onCheckedChange={(checked) =>
                    field.onChange(checked === true)
                  }
                />
                Mostrar total en el PDF
              </label>
            )}
          />
          <Controller
            control={control}
            name="hideIndividualPricesInPdf"
            render={({ field }) => (
              <label className="flex cursor-pointer items-center gap-2 text-sm text-muted-foreground">
                <Checkbox
                  checked={field.value}
                  onCheckedChange={(checked) =>
                    field.onChange(checked === true)
                  }
                />
                Ocultar precios por ítem en el PDF
              </label>
            )}
          />
        </div>
      </div>
    </div>
  )
}
