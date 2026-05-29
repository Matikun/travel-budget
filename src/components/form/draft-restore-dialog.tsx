import { format } from 'date-fns'
import { es } from 'date-fns/locale'

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'

type DraftRestoreDialogProps = {
  open: boolean
  savedAt: string | null
  onRestore: () => void
  onDiscard: () => void
}

function formatSavedAt(iso: string | null): string {
  if (!iso) {
    return ''
  }
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) {
    return ''
  }
  return format(date, "d 'de' MMMM yyyy, HH:mm", { locale: es })
}

export function DraftRestoreDialog({
  open,
  savedAt,
  onRestore,
  onDiscard,
}: DraftRestoreDialogProps) {
  const savedLabel = formatSavedAt(savedAt)

  return (
    <AlertDialog open={open}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>¿Restaurar borrador guardado?</AlertDialogTitle>
          <AlertDialogDescription>
            {savedLabel
              ? `Hay un borrador del ${savedLabel}. Podés recuperarlo o empezar un presupuesto nuevo.`
              : 'Hay un borrador guardado en este navegador. Podés recuperarlo o empezar un presupuesto nuevo.'}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={onDiscard}>
            Empezar de cero
          </AlertDialogCancel>
          <AlertDialogAction onClick={onRestore}>
            Restaurar borrador
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

type DraftIncompatibleDialogProps = {
  open: boolean
  onDiscard: () => void
}

export function DraftIncompatibleDialog({
  open,
  onDiscard,
}: DraftIncompatibleDialogProps) {
  return (
    <AlertDialog open={open}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Borrador incompatible</AlertDialogTitle>
          <AlertDialogDescription>
            El borrador guardado pertenece a una versión anterior del formulario
            y no se puede restaurar. Descartalo para continuar.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogAction onClick={onDiscard}>
            Descartar borrador
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
