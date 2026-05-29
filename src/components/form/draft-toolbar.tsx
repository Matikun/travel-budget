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
    <div
      className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:justify-end"
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
        onClick={onNewBudget}
      >
        <FilePlus2 className="size-4" />
        Nuevo presupuesto
      </Button>
      <Button type="button" variant="outline" size="sm" onClick={onExport}>
        <Download className="size-4" />
        Exportar JSON
      </Button>
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => fileInputRef.current?.click()}
      >
        <FileUp className="size-4" />
        Importar JSON
      </Button>
    </div>
  )
}
