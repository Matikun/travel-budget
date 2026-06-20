import { zodResolver } from '@hookform/resolvers/zod'
import { Eye } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { useForm, useWatch, type Resolver } from 'react-hook-form'

import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import {
  clearStoredDraft,
  draftHasContent,
  exportDraftJson,
  freshBudgetValues,
  importDraftJson,
  readStoredDraft,
  writeStoredDraft,
} from '@/lib/draft'
import { readStoredAgencyLogo, type AgencyLogo } from '@/lib/agency-logo'
import { downloadBudgetPdf } from '@/lib/download-pdf'
import { resolvePdfLogo, toValidatedBudget } from '@/lib/pdf-helpers'
import { formatPdfError, logPdfError, type PdfErrorInfo } from '@/lib/pdf-error'
import {
  budgetFormSchema,
  defaultBudgetValues,
  initialBudgetValues,
  type Budget,
  type BudgetFormValues,
} from '@/lib/schema'

import { DraftIncompatibleDialog, DraftRestoreDialog } from './draft-restore-dialog'
import { DraftToolbar } from './draft-toolbar'
import { FormPageHeader } from './form-page-header'
import { EstimatedTotalBar } from './estimated-total-bar'
import { ExcursionsSection } from './excursions-section'
import { FlightsSection } from './flights-section'
import { HeaderSection } from './header-section'
import { HotelsSection } from './hotels-section'
import { PdfLayoutSection } from './pdf-layout-section'
import { PdfBrandingSection } from './pdf-branding-section'
import { PdfPreviewDialog } from './pdf-preview-dialog'
import { TransfersSection } from './transfers-section'
import { CarRentalsSection } from './car-rentals-section'
import { TravelAssistanceSection } from './travel-assistance-section'

const DRAFT_DEBOUNCE_MS = 500

type BudgetPdfResult =
  | { ok: true; budget: Budget; logoDataUrl?: string }
  | { ok: false; error: PdfErrorInfo }

async function resolveBudgetForPdf(
  trigger: () => Promise<boolean>,
  getValues: () => BudgetFormValues,
  agencyLogo: AgencyLogo | null,
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

  return {
    ok: true,
    budget,
    logoDataUrl: resolvePdfLogo(
      getValues().includeLogoInPdf,
      agencyLogo?.dataUrl,
    ),
  }
}

function downloadJsonBackup(filename: string, content: string) {
  const blob = new Blob([content], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = filename
  anchor.click()
  URL.revokeObjectURL(url)
}

function resolveMountDraftState() {
  const result = readStoredDraft()
  const incompatibleOpen =
    result.status === 'incompatible' || result.status === 'invalid'

  return {
    incompatibleOpen,
    restoreOpen: result.status === 'ok',
    pendingDraft: result.status === 'ok' ? result.values : null,
    draftSavedAt: result.status === 'ok' ? result.savedAt : null,
    formDefaults:
      result.status === 'missing' && import.meta.env.MODE === 'development'
        ? initialBudgetValues()
        : defaultBudgetValues(),
  }
}

export function BudgetForm() {
  const [mountDraft] = useState(resolveMountDraftState)
  const [pdfError, setPdfError] = useState<PdfErrorInfo | null>(null)
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false)
  const [previewOpen, setPreviewOpen] = useState(false)
  const [previewBudget, setPreviewBudget] = useState<Budget | null>(null)
  const [agencyLogo, setAgencyLogo] = useState<AgencyLogo | null>(() =>
    readStoredAgencyLogo(),
  )
  const [restoreOpen, setRestoreOpen] = useState(mountDraft.restoreOpen)
  const [incompatibleOpen, setIncompatibleOpen] = useState(
    mountDraft.incompatibleOpen,
  )
  const [pendingDraft, setPendingDraft] = useState<BudgetFormValues | null>(
    mountDraft.pendingDraft,
  )
  const [importError, setImportError] = useState<string | null>(null)
  const skipPersistRef = useRef(false)

  const {
    control,
    register,
    handleSubmit,
    trigger,
    getValues,
    reset,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<BudgetFormValues>({
    resolver: zodResolver(budgetFormSchema) as Resolver<BudgetFormValues>,
    defaultValues: mountDraft.formDefaults,
    mode: 'onSubmit',
  })

  const watchedValues = useWatch({ control })
  const includeLogoInPdf = useWatch({ control, name: 'includeLogoInPdf' })
  const pdfLayout = useWatch({ control, name: 'pdfLayout' }) ?? 'budget'

  const previewLogoDataUrl = previewBudget
    ? resolvePdfLogo(includeLogoInPdf, agencyLogo?.dataUrl)
    : undefined

  useEffect(() => {
    if (skipPersistRef.current || restoreOpen || incompatibleOpen) {
      return
    }

    const timer = window.setTimeout(() => {
      writeStoredDraft(getValues())
    }, DRAFT_DEBOUNCE_MS)

    return () => window.clearTimeout(timer)
  }, [watchedValues, restoreOpen, incompatibleOpen, getValues])

  const applyFormValues = (values: BudgetFormValues) => {
    skipPersistRef.current = true
    reset(values)
    skipPersistRef.current = false
    writeStoredDraft(values)
  }

  const handleRestoreDraft = () => {
    if (pendingDraft) {
      applyFormValues(pendingDraft)
    }
    setRestoreOpen(false)
    setPendingDraft(null)
  }

  const handleDiscardDraft = () => {
    clearStoredDraft()
    setRestoreOpen(false)
    setPendingDraft(null)

    if (import.meta.env.MODE === 'development') {
      applyFormValues(initialBudgetValues())
    } else {
      applyFormValues(freshBudgetValues())
    }
  }

  const handleDiscardIncompatible = () => {
    clearStoredDraft()
    setIncompatibleOpen(false)

    if (import.meta.env.MODE === 'development') {
      applyFormValues(initialBudgetValues())
    }
  }

  const handleNewBudget = () => {
    const current = getValues()
    if (draftHasContent(current)) {
      const confirmed = window.confirm(
        '¿Crear un presupuesto nuevo? Se perderán los datos actuales del formulario.',
      )
      if (!confirmed) {
        return
      }
    }

    applyFormValues(freshBudgetValues())
    setImportError(null)
  }

  const handleExportJson = () => {
    const values = getValues()
    const slug = values.destination.trim()
      ? values.destination.trim().toLowerCase().replace(/\s+/g, '-')
      : 'borrador'
    downloadJsonBackup(`travel-budget-${slug}.json`, exportDraftJson(values))
  }

  const handleImportJson = async (file: File) => {
    setImportError(null)

    let raw: string
    try {
      raw = await file.text()
    } catch {
      setImportError('No se pudo leer el archivo.')
      return
    }

    const result = importDraftJson(raw)

    if (result.status === 'incompatible') {
      setImportError(
        'El archivo pertenece a una versión anterior y no se puede importar.',
      )
      return
    }

    if (result.status !== 'ok') {
      setImportError('El archivo JSON no es un borrador válido.')
      return
    }

    applyFormValues(result.values)
  }

  const handleDownloadPdf = async () => {
    setPdfError(null)

    const result = await resolveBudgetForPdf(trigger, getValues, agencyLogo)
    if (!result.ok) {
      setPdfError(result.error)
      return
    }

    try {
      setIsGeneratingPdf(true)
      await downloadBudgetPdf(result.budget, result.logoDataUrl)
    } catch (error) {
      logPdfError(error, result.budget)
      setPdfError(formatPdfError(error))
    } finally {
      setIsGeneratingPdf(false)
    }
  }

  const handlePreviewPdf = async () => {
    setPdfError(null)
    const result = await resolveBudgetForPdf(trigger, getValues, agencyLogo)

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
        <Card className="gap-0 overflow-hidden border-border/80 py-0 shadow-md dark:border-border dark:shadow-lg dark:shadow-black/25">
          <FormPageHeader
            destination={watchedValues?.destination ?? ''}
            toolbar={
              <DraftToolbar
                onNewBudget={handleNewBudget}
                onExport={handleExportJson}
                onImport={(file) => void handleImportJson(file)}
              />
            }
          />
          <CardContent className="space-y-8 px-6 py-6">
            {importError ? (
              <div
                className="rounded-md border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive"
                role="alert"
              >
                {importError}
              </div>
            ) : null}
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
              pdfLayout={pdfLayout}
            />
            <Separator />
            <TransfersSection
              control={control}
              errors={errors}
              register={register}
              pdfLayout={pdfLayout}
            />
            <Separator />
            <CarRentalsSection
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
            <PdfBrandingSection
              control={control}
              agencyLogo={agencyLogo}
              onAgencyLogoChange={setAgencyLogo}
              setValue={setValue}
            />
            <Separator />
            <PdfLayoutSection control={control} />
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

      <DraftRestoreDialog
        open={restoreOpen}
        savedAt={mountDraft.draftSavedAt}
        onRestore={handleRestoreDraft}
        onDiscard={handleDiscardDraft}
      />

      <DraftIncompatibleDialog
        open={incompatibleOpen}
        onDiscard={handleDiscardIncompatible}
      />

      <PdfPreviewDialog
        open={previewOpen}
        onOpenChange={setPreviewOpen}
        budget={previewBudget}
        logoDataUrl={previewLogoDataUrl}
        onDownload={() => handleDownloadPdf()}
        isDownloading={isGeneratingPdf}
      />
    </>
  )
}
