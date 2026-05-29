import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'

function App() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-lg flex-col justify-center gap-6 p-6">
      <Card>
        <CardHeader>
          <CardTitle>Travel Budget</CardTitle>
          <CardDescription>
            Presupuestos de viaje — configuración inicial (Fase 0).
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="destination">Destino</Label>
            <Input id="destination" placeholder="Ej. Bariloche" disabled />
          </div>
          <Separator />
          <Button type="button" className="w-full" disabled>
            Formulario — próximamente
          </Button>
        </CardContent>
      </Card>
    </main>
  )
}

export default App
