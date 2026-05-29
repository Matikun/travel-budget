import { CardHeader } from '@/components/ui/card'

type FormPageHeaderProps = {
  destination: string
  toolbar: React.ReactNode
}

export function FormPageHeader({ destination, toolbar }: FormPageHeaderProps) {
  const trimmed = destination.trim()
  const hasDestination = Boolean(trimmed)

  return (
    <CardHeader className="gap-0 border-b p-0">
      <div className="space-y-1.5 px-6 pt-6 pb-5">
        {hasDestination ? (
          <>
            <p className="text-xs font-medium tracking-wider text-muted-foreground uppercase">
              Presupuesto
            </p>
            <h1 className="text-2xl font-semibold tracking-tight text-balance sm:text-3xl">
              {trimmed}
            </h1>
          </>
        ) : (
          <h1 className="text-2xl font-semibold tracking-tight text-balance sm:text-3xl">
            Nuevo presupuesto
          </h1>
        )}
        <p className="max-w-prose pt-1 text-sm leading-relaxed text-muted-foreground">
          Completá destino, fechas y pasajeros. Vuelos, hoteles y el resto de las
          secciones son opcionales.
        </p>
        <p className="text-xs text-muted-foreground/80">
          El borrador se guarda automáticamente en este navegador.
        </p>
      </div>

      <div className="border-t border-border/60 bg-muted/20 px-6 py-3 dark:bg-muted/10">
        {toolbar}
      </div>
    </CardHeader>
  )
}
