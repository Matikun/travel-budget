import type { Control } from 'react-hook-form'
import { Controller } from 'react-hook-form'

import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { BudgetFormValues, PdfLayout } from '@/lib/schema'

type PdfLayoutSectionProps = {
  control: Control<BudgetFormValues>
}

const PDF_LAYOUT_OPTIONS: { value: PdfLayout; label: string; description: string }[] =
  [
    {
      value: 'budget',
      label: 'Presupuesto',
      description: 'Agrupa por tipo: vuelos, hoteles, excursiones…',
    },
    {
      value: 'itinerary',
      label: 'Itinerario',
      description: 'Orden cronológico por fecha y hora del viaje',
    },
  ]

export function PdfLayoutSection({ control }: PdfLayoutSectionProps) {
  return (
    <section
      className="space-y-4"
      aria-labelledby="pdf-layout-heading"
    >
      <div>
        <h2
          id="pdf-layout-heading"
          className="text-sm font-semibold tracking-tight"
        >
          Vista del PDF
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Elegí cómo se organiza el contenido en la vista previa y la descarga.
        </p>
      </div>

      <Controller
        control={control}
        name="pdfLayout"
        render={({ field }) => (
          <div className="space-y-2">
            <Label htmlFor="pdf-layout-select">Formato</Label>
            <Select
              value={field.value}
              onValueChange={(value) => field.onChange(value as PdfLayout)}
            >
              <SelectTrigger
                id="pdf-layout-select"
                className="w-full sm:w-[min(100%,20rem)]"
              >
                <SelectValue placeholder="Seleccionar formato" />
              </SelectTrigger>
              <SelectContent>
                {PDF_LAYOUT_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              {
                PDF_LAYOUT_OPTIONS.find((option) => option.value === field.value)
                  ?.description
              }
            </p>
            {field.value === 'itinerary' ? (
              <p className="text-xs text-muted-foreground">
                En vista itinerario, las excursiones y traslados con datos deben
                tener fecha.
              </p>
            ) : null}
          </div>
        )}
      />
    </section>
  )
}
