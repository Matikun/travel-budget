import { ImagePlus, Trash2 } from 'lucide-react'
import { useRef, useState } from 'react'
import type { Control, FieldPath, UseFormSetValue } from 'react-hook-form'
import { Controller } from 'react-hook-form'

import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import {
  ITEM_PHOTO_ERRORS,
  ITEM_PHOTO_MAX_STORED_KB,
  processItemPhotoFile,
} from '@/lib/item-photo'
import type { BudgetFormValues } from '@/lib/schema'

type ItemPhotoFieldProps = {
  control: Control<BudgetFormValues>
  photoFieldName: FieldPath<BudgetFormValues>
  showFieldName: FieldPath<BudgetFormValues>
  photoDataUrl?: string
  setValue: UseFormSetValue<BudgetFormValues>
  inputId: string
}

export function ItemPhotoField({
  control,
  photoFieldName,
  showFieldName,
  photoDataUrl,
  setValue,
  inputId,
}: ItemPhotoFieldProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)

  const handleUpload = async (file: File) => {
    setUploadError(null)
    setIsProcessing(true)

    try {
      const dataUrl = await processItemPhotoFile(file)
      setValue(photoFieldName, dataUrl, { shouldDirty: true })
      setValue(showFieldName, true, { shouldDirty: true })
    } catch (error) {
      const message =
        error instanceof Error ? error.message : ITEM_PHOTO_ERRORS.processFailed
      setUploadError(message)
    } finally {
      setIsProcessing(false)
    }
  }

  const handleRemove = () => {
    setValue(photoFieldName, undefined, { shouldDirty: true })
    setValue(showFieldName, true, { shouldDirty: true })
    setUploadError(null)
  }

  return (
    <div className="space-y-3 rounded-md border border-dashed bg-background/60 p-3">
      <div>
        <Label htmlFor={inputId}>Foto (opcional)</Label>
        <p className="text-xs text-muted-foreground">
          PNG o JPG. Máx. {ITEM_PHOTO_MAX_STORED_KB} KB después de optimizar.
        </p>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
        {photoDataUrl ? (
          <img
            src={photoDataUrl}
            alt="Vista previa de la foto"
            className="h-20 max-w-[140px] rounded-md border bg-background object-cover"
          />
        ) : null}

        <div className="flex flex-col gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/png,image/jpeg,.png,.jpg,.jpeg"
            className="sr-only"
            tabIndex={-1}
            aria-labelledby={`${inputId}-trigger`}
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
              id={`${inputId}-trigger`}
              type="button"
              variant="outline"
              size="sm"
              disabled={isProcessing}
              onClick={() => fileInputRef.current?.click()}
            >
              <ImagePlus className="size-4" />
              {isProcessing ? 'Procesando…' : photoDataUrl ? 'Cambiar foto' : 'Subir foto'}
            </Button>
            {photoDataUrl ? (
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={isProcessing}
                onClick={handleRemove}
              >
                <Trash2 className="size-4" />
                Quitar foto
              </Button>
            ) : null}
          </div>

          {photoDataUrl ? (
            <Controller
              control={control}
              name={showFieldName}
              render={({ field }) => (
                <label className="flex cursor-pointer items-center gap-2 text-sm text-muted-foreground">
                  <Checkbox
                    checked={field.value !== false}
                    onCheckedChange={(checked) => field.onChange(checked === true)}
                  />
                  Mostrar foto en el PDF
                </label>
              )}
            />
          ) : null}
        </div>
      </div>

      {uploadError ? (
        <div
          className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
          role="alert"
        >
          {uploadError}
        </div>
      ) : null}
    </div>
  )
}
