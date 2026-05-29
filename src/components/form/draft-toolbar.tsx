import { Download, FileUp, FilePlus2 } from 'lucide-react'
import { useRef } from 'react'

import { Button } from '@/components/ui/button'

type DraftToolbarProps = {
  onNewBudget: () => void
  onExport: () => void
  onImport: (file: File) => void
}

export function DraftToolbar({
  onNewBudget,
  onExport,
  onImport,
}: DraftToolbarProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)

  return (
    <div className="flex flex-col gap-2.5">
      <p className="text-xs font-medium text-muted-foreground">Borrador y respaldo</p>
      <div
        className="grid grid-cols-1 gap-2 min-[480px]:grid-cols-3"
        role="group"
        aria-label="Borrador y respaldo"
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="application/json,.json"
          className="sr-only"
          aria-hidden
          tabIndex={-1}
          onChange={(event) => {
            const file = event.target.files?.[0]
            if (file) {
              onImport(file)
            }
            event.target.value = ''
          }}
        />
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="w-full justify-center"
          onClick={onNewBudget}
        >
          <FilePlus2 className="size-4" />
          Nuevo presupuesto
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="w-full justify-center"
          onClick={onExport}
        >
          <Download className="size-4" />
          Exportar JSON
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="w-full justify-center"
          onClick={() => fileInputRef.current?.click()}
        >
          <FileUp className="size-4" />
          Importar JSON
        </Button>
      </div>
    </div>
  )
}
