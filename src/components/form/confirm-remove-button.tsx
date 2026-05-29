import { Trash2 } from 'lucide-react'
import { useState } from 'react'

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
import { Button } from '@/components/ui/button'

type ConfirmRemoveButtonProps = {
  itemLabel: string
  hasData: boolean
  onConfirm: () => void
  disabled?: boolean
  iconOnly?: boolean
}

export function ConfirmRemoveButton({
  itemLabel,
  hasData,
  onConfirm,
  disabled = false,
  iconOnly = false,
}: ConfirmRemoveButtonProps) {
  const [open, setOpen] = useState(false)

  const handleClick = () => {
    if (hasData) {
      setOpen(true)
      return
    }
    onConfirm()
  }

  return (
    <>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        disabled={disabled}
        onClick={handleClick}
        className="text-destructive hover:text-destructive"
        aria-label={`Quitar ${itemLabel}`}
      >
        <Trash2 className={iconOnly ? 'size-4' : 'mr-1 size-4'} />
        {iconOnly ? null : 'Quitar'}
      </Button>

      <AlertDialog open={open} onOpenChange={setOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Quitar {itemLabel}?</AlertDialogTitle>
            <AlertDialogDescription>
              Este ítem tiene datos cargados. Si lo quitás, se perderá la
              información ingresada.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={() => {
                onConfirm()
                setOpen(false)
              }}
            >
              Quitar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
