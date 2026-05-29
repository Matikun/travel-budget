import { zodResolver } from '@hookform/resolvers/zod'
import { Eye } from 'lucide-react'
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
  type Budget,
  type BudgetFormValues,
} from '@/lib/schema'

import { EstimatedTotalBar } from './estimated-total-bar'
import { ExcursionsSection } from './excursions-section'
import { FlightsSection } from './flights-section'
import { HeaderSection } from './header-section'
import { HotelsSection } from './hotels-section'
import { PdfPreviewDialog } from './pdf-preview-dialog'
import { TransfersSection } from './transfers-section'
import { TravelAssistanceSection } from './travel-assistance-section'

type BudgetPdfResult =
  | { ok: true; budget: Budget }
  | { ok: false; error: PdfErrorInfo }

async function resolveBudgetForPdf(
  trigger: () => Promise<boolean>,
  getValues: () => BudgetFormValues,
): Promise<BudgetPdfResult> {
  const valid = await trigger()

  if (!valid) {
    return {
      ok: false,
      error: {
        title:
          'Hay errores en el formulario. Corregilos antes de generar el PDF.',
        hint: 'Revisá los campos marcados en rojo.',
      },
    }
  }

  const budget = toValidatedBudget(getValues())
  if (!budget) {
    return {
      ok: false,
      error: {
        title: 'Faltan fechas obligatorias en el encabezado.',
      },
    }
  }

  return { ok: true, budget }
}

export function BudgetForm() {
  const [pdfError, setPdfError] = useState<PdfErrorInfo | null>(null)
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false)
  const [previewOpen, setPreviewOpen] = useState(false)
  const [previewBudget, setPreviewBudget] = useState<Budget | null>(null)

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

  const handleDownloadPdf = async (budget?: Budget) => {
    setPdfError(null)

    let resolvedBudget = budget
    if (!resolvedBudget) {
      const result = await resolveBudgetForPdf(trigger, getValues)
      if (!result.ok) {
        setPdfError(result.error)
        return
      }
      resolvedBudget = result.budget
    }

    try {
      setIsGeneratingPdf(true)
      const { downloadBudgetPdf } = await import('@/lib/download-pdf')
      await downloadBudgetPdf(resolvedBudget)
    } catch (error) {
      logPdfError(error, resolvedBudget)
      setPdfError(formatPdfError(error))
    } finally {
      setIsGeneratingPdf(false)
    }
  }

  const handlePreviewPdf = async () => {
    setPdfError(null)
    const result = await resolveBudgetForPdf(trigger, getValues)

    if (!result.ok) {
      setPdfError(result.error)
      return
    }

    setPreviewBudget(result.budget)
    setPreviewOpen(true)
  }

  return (
    <>
      <form
        onSubmit={handleSubmit(() => undefined)}
        className="mx-auto flex w-full max-w-3xl flex-col gap-6 p-4 pb-28 sm:p-6"
        noValidate
        aria-label="Formulario de presupuesto de viaje"
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
            <HotelsSection
              control={control}
              errors={errors}
              register={register}
            />
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
            <div
              className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end"
              role="group"
              aria-label="Acciones del PDF"
            >
              <Button
                type="button"
                variant="outline"
                disabled={isSubmitting || isGeneratingPdf}
                onClick={() => void handlePreviewPdf()}
              >
                <Eye className="size-4" />
                Vista previa
              </Button>
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

      <PdfPreviewDialog
        open={previewOpen}
        onOpenChange={setPreviewOpen}
        budget={previewBudget}
        onDownload={() => handleDownloadPdf(previewBudget ?? undefined)}
        isDownloading={isGeneratingPdf}
      />
    </>
  )
}
