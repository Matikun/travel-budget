import type { Control } from 'react-hook-form'
import { Controller, useWatch } from 'react-hook-form'

import { Card, CardContent } from '@/components/ui/card'
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
      <Card className="border-primary/20 shadow-md">
        <CardContent className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-base font-semibold tabular-nums">
            Total estimado:{' '}
            <span className="text-primary">{formatUsd(total)}</span>
          </p>
          <Controller
            control={control}
            name="showTotalInPdf"
            render={({ field }) => (
              <label className="flex cursor-pointer items-center gap-2 text-sm">
                <Checkbox
                  checked={field.value}
                  onCheckedChange={(checked) => field.onChange(checked === true)}
                />
                Mostrar total en el PDF
              </label>
            )}
          />
        </CardContent>
      </Card>
    </div>
  )
}
