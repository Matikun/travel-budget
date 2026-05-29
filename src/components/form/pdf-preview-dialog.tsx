import { Download } from 'lucide-react'
import { useEffect, useState } from 'react'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { generateBudgetPdfBlob } from '@/lib/download-pdf'
import { formatPdfError, type PdfErrorInfo } from '@/lib/pdf-error'
import type { Budget } from '@/lib/schema'

type PdfPreviewDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  budget: Budget | null
  onDownload: () => Promise<void>
  isDownloading: boolean
}

export function PdfPreviewDialog({
  open,
  onOpenChange,
  budget,
  onDownload,
  isDownloading,
}: PdfPreviewDialogProps) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [previewError, setPreviewError] = useState<PdfErrorInfo | null>(null)

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl)
      }
      setPreviewUrl(null)
      setPreviewError(null)
      setIsLoading(false)
    }
    onOpenChange(nextOpen)
  }

  useEffect(() => {
    if (!open || !budget) {
      return
    }

    let cancelled = false
    let objectUrl: string | null = null

    const loadPreview = async () => {
      setIsLoading(true)
      setPreviewError(null)
      setPreviewUrl(null)

      try {
        const blob = await generateBudgetPdfBlob(budget)
        if (cancelled) {
          return
        }
        objectUrl = URL.createObjectURL(blob)
        setPreviewUrl(objectUrl)
      } catch (error) {
        if (!cancelled) {
          setPreviewError(formatPdfError(error))
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false)
        }
      }
    }

    void loadPreview()

    return () => {
      cancelled = true
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl)
      }
    }
  }, [open, budget])

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        className="flex max-h-[92vh] flex-col gap-4 sm:max-w-4xl"
        aria-describedby="pdf-preview-description"
      >
        <DialogHeader>
          <DialogTitle>Vista previa del PDF</DialogTitle>
          <DialogDescription id="pdf-preview-description">
            Revisá la cotización antes de descargarla.
          </DialogDescription>
        </DialogHeader>

        <div className="min-h-[50vh] flex-1 overflow-hidden rounded-md border bg-muted/20">
          {isLoading ? (
            <p className="flex h-full min-h-[50vh] items-center justify-center text-sm text-foreground/80">
              Generando vista previa…
            </p>
          ) : null}

          {!isLoading && previewError ? (
            <div
              className="space-y-2 p-4 text-sm text-destructive"
              role="alert"
            >
              <p className="font-medium">{previewError.title}</p>
              {previewError.detail ? (
                <p className="break-all font-mono text-xs opacity-90">
                  {previewError.detail}
                </p>
              ) : null}
            </div>
          ) : null}

          {!isLoading && previewUrl ? (
            <>
              <iframe
                title="Vista previa del presupuesto en PDF"
                src={previewUrl}
                className="hidden h-[70vh] w-full sm:block"
              />
              <div className="flex h-full min-h-[40vh] flex-col items-center justify-center gap-3 p-6 text-center sm:hidden">
                <p className="text-sm text-foreground/80">
                  En pantallas pequeñas la vista previa integrada puede ser
                  limitada. Descargá el PDF para revisarlo con calidad.
                </p>
                <Button
                  type="button"
                  disabled={isDownloading}
                  onClick={() => void onDownload()}
                >
                  <Download className="size-4" />
                  {isDownloading ? 'Generando PDF…' : 'Descargar PDF'}
                </Button>
              </div>
            </>
          ) : null}
        </div>

        <DialogFooter className="gap-2 sm:justify-between">
          <Button
            type="button"
            variant="outline"
            onClick={() => handleOpenChange(false)}
          >
            Cerrar
          </Button>
          <Button
            type="button"
            disabled={isDownloading || isLoading || Boolean(previewError)}
            onClick={() => void onDownload()}
            className="hidden sm:inline-flex"
          >
            <Download className="size-4" />
            {isDownloading ? 'Generando PDF…' : 'Descargar PDF'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
