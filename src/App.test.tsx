import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'

import App from './App'

describe('App', () => {
  it('renders the budget form shell', () => {
    render(<App />)
    expect(screen.getByText('Presupuesto de viaje')).toBeInTheDocument()
    expect(screen.getByLabelText('Destino')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /agregar vuelo/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /agregar hotel/i })).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: /agregar excursión/i }),
    ).toBeInTheDocument()
    expect(screen.getByText(/total estimado/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/mostrar total en el pdf/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /descargar pdf/i })).toBeInTheDocument()
  })

  it('can add and remove a flight row', async () => {
    const user = userEvent.setup()
    render(<App />)

    await user.click(screen.getByRole('button', { name: /agregar vuelo/i }))
    expect(screen.getByText('Vuelo 1')).toBeInTheDocument()

    const flightCard = screen.getByText('Vuelo 1').closest('div.rounded-lg')
    expect(flightCard).not.toBeNull()
    await user.click(
      within(flightCard as HTMLElement).getByRole('button', { name: /quitar/i }),
    )
    expect(screen.queryByText('Vuelo 1')).not.toBeInTheDocument()
  })
})
