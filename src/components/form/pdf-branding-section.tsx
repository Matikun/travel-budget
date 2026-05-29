import { ImagePlus, Trash2 } from 'lucide-react'
import { useRef, useState } from 'react'
import type { Control, UseFormSetValue } from 'react-hook-form'
import { Controller } from 'react-hook-form'

import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import {
  AGENCY_LOGO_ERRORS,
  AGENCY_LOGO_MAX_STORED_KB,
  clearStoredAgencyLogo,
  processLogoFile,
  writeStoredAgencyLogo,
  type AgencyLogo,
} from '@/lib/agency-logo'
import type { BudgetFormValues } from '@/lib/schema'

type PdfBrandingSectionProps = {
  control: Control<BudgetFormValues>
  agencyLogo: AgencyLogo | null
  onAgencyLogoChange: (logo: AgencyLogo | null) => void
  setValue: UseFormSetValue<BudgetFormValues>
}

export function PdfBrandingSection({
  control,
  agencyLogo,
  onAgencyLogoChange,
  setValue,
}: PdfBrandingSectionProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)

  const handleUpload = async (file: File) => {
    setUploadError(null)
    setIsProcessing(true)

    try {
      const logo = await processLogoFile(file)
      writeStoredAgencyLogo(logo)
      onAgencyLogoChange(logo)
      setValue('includeLogoInPdf', true, { shouldDirty: true })
    } catch (error) {
      const message =
        error instanceof Error ? error.message : AGENCY_LOGO_ERRORS.processFailed
      setUploadError(message)
    } finally {
      setIsProcessing(false)
    }
  }

  const handleRemove = () => {
    clearStoredAgencyLogo()
    onAgencyLogoChange(null)
    setValue('includeLogoInPdf', false, { shouldDirty: true })
    setUploadError(null)
  }

  return (
    <section
      className="space-y-4"
      aria-labelledby="pdf-branding-heading"
    >
      <div>
        <h2
          id="pdf-branding-heading"
          className="text-sm font-semibold tracking-tight"
        >
          Logo del PDF
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          PNG o JPG. Fondo transparente recomendado. Máx. {AGENCY_LOGO_MAX_STORED_KB}{' '}
          KB después de optimizar.
        </p>
      </div>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
        {agencyLogo ? (
          <img
            src={agencyLogo.dataUrl}
            alt="Logo de la agencia"
            className="h-14 max-w-[120px] rounded-md border bg-background object-contain p-1"
          />
        ) : null}

        <div className="flex flex-col gap-3">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/png,image/jpeg,.png,.jpg,.jpeg"
            className="sr-only"
            tabIndex={-1}
            aria-labelledby="pdf-logo-upload-trigger"
            onChange={(event) => {
              const file = event.target.files?.[0]
              if (file) {
                void handleUpload(file)
              }
              event.target.value = ''
            }}
          />
          <div className="flex flex-wrap gap-2">
            <Button
              id="pdf-logo-upload-trigger"
              type="button"
              variant="outline"
              size="sm"
              disabled={isProcessing}
              onClick={() => fileInputRef.current?.click()}
            >
              <ImagePlus className="size-4" />
              {isProcessing ? 'Procesando…' : 'Subir logo'}
            </Button>
            {agencyLogo ? (
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={isProcessing}
                onClick={handleRemove}
              >
                <Trash2 className="size-4" />
                Quitar logo
              </Button>
            ) : null}
          </div>

          <Controller
            control={control}
            name="includeLogoInPdf"
            render={({ field }) => (
              <div className="space-y-1">
                <label
                  className={`flex items-center gap-2 text-sm ${
                    agencyLogo
                      ? 'cursor-pointer text-muted-foreground'
                      : 'cursor-not-allowed text-muted-foreground/70'
                  }`}
                >
                  <Checkbox
                    checked={field.value}
                    disabled={!agencyLogo}
                    onCheckedChange={(checked) =>
                      field.onChange(checked === true)
                    }
                  />
                  Incluir logo en el PDF
                </label>
                {!agencyLogo ? (
                  <p className="text-xs text-muted-foreground">
                    Subí un logo para incluirlo en el PDF.
                  </p>
                ) : null}
              </div>
            )}
          />
        </div>
      </div>

      {uploadError ? (
        <div
          className="rounded-md border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive"
          role="alert"
        >
          {uploadError}
        </div>
      ) : null}
    </section>
  )
}
