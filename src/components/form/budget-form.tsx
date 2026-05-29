import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { useForm } from 'react-hook-form'

import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { toValidatedBudget } from '@/lib/pdf-helpers'
import { formatPdfError, logPdfError, type PdfErrorInfo } from '@/lib/pdf-error'
import {
  budgetFormSchema,
  initialBudgetValues,
  type BudgetFormValues,
} from '@/lib/schema'

import { EstimatedTotalBar } from './estimated-total-bar'
import { ExcursionsSection } from './excursions-section'
import { FlightsSection } from './flights-section'
import { HeaderSection } from './header-section'
import { HotelsSection } from './hotels-section'
import { TransfersSection } from './transfers-section'
import { TravelAssistanceSection } from './travel-assistance-section'

export function BudgetForm() {
  const [pdfError, setPdfError] = useState<PdfErrorInfo | null>(null)
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false)

  const {
    control,
    register,
    handleSubmit,
    trigger,
    getValues,
    formState: { errors, isSubmitting },
  } = useForm<BudgetFormValues>({
    resolver: zodResolver(budgetFormSchema),
    defaultValues: initialBudgetValues(),
    mode: 'onSubmit',
  })

  const handleDownloadPdf = async () => {
    setPdfError(null)
    const valid = await trigger()

    if (!valid) {
      setPdfError({
        title: 'Hay errores en el formulario. Corregilos antes de generar el PDF.',
        hint: 'Revisá los campos marcados en rojo.',
      })
      return
    }

    const budget = toValidatedBudget(getValues())
    if (!budget) {
      setPdfError({
        title: 'Faltan fechas obligatorias en el encabezado.',
      })
      return
    }

    try {
      setIsGeneratingPdf(true)
      const { downloadBudgetPdf } = await import('@/lib/download-pdf')
      await downloadBudgetPdf(budget)
    } catch (error) {
      logPdfError(error, budget)
      setPdfError(formatPdfError(error))
    } finally {
      setIsGeneratingPdf(false)
    }
  }

  return (
    <form
      onSubmit={handleSubmit(() => undefined)}
      className="mx-auto flex w-full max-w-3xl flex-col gap-6 p-4 pb-28 sm:p-6"
      noValidate
    >
      <Card>
        <CardHeader>
          <CardTitle>Presupuesto de viaje</CardTitle>
          <CardDescription>
            Complete los datos del viaje. Vuelos y hoteles son opcionales.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-8">
          <HeaderSection
            control={control}
            errors={errors}
            register={register}
          />
          <Separator />
          <FlightsSection
            control={control}
            errors={errors}
            register={register}
          />
          <Separator />
          <HotelsSection control={control} errors={errors} register={register} />
          <Separator />
          <ExcursionsSection
            control={control}
            errors={errors}
            register={register}
          />
          <Separator />
          <TransfersSection
            control={control}
            errors={errors}
            register={register}
          />
          <Separator />
          <TravelAssistanceSection
            control={control}
            errors={errors}
            register={register}
          />
          <Separator />
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end">
            <Button
              type="button"
              disabled={isSubmitting || isGeneratingPdf}
              onClick={() => void handleDownloadPdf()}
            >
              {isGeneratingPdf ? 'Generando PDF…' : 'Descargar PDF'}
            </Button>
          </div>
          {pdfError ? (
            <div
              className="space-y-2 rounded-md border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive"
              role="alert"
            >
              <p className="font-medium">{pdfError.title}</p>
              {pdfError.detail ? (
                <p className="break-all font-mono text-xs opacity-90">
                  {pdfError.detail}
                </p>
              ) : null}
              {pdfError.hint ? (
                <p className="text-xs opacity-90">{pdfError.hint}</p>
              ) : null}
            </div>
          ) : null}
        </CardContent>
      </Card>
      <EstimatedTotalBar control={control} />
    </form>
  )
}
