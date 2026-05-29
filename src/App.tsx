import { BudgetForm } from '@/components/form/budget-form'
import { ThemeToggle } from '@/components/theme-toggle'

function App() {
  return (
    <main className="app-shell relative min-h-dvh">
      <ThemeToggle className="absolute top-4 right-4 z-20 sm:top-6 sm:right-6" />
      <BudgetForm />
    </main>
  )
}

export default App
