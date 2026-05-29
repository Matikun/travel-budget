import { pdf } from '@react-pdf/renderer'

import { BudgetPdf } from '@/components/pdf/budget-pdf'
import { buildQuoteFilename } from '@/lib/pdf-helpers'
import type { Budget } from '@/lib/schema'

/** Generates a PDF blob from validated budget data. */
export async function generateBudgetPdfBlob(budget: Budget): Promise<Blob> {
  const instance = pdf(<BudgetPdf budget={budget} />)
  const blob = await instance.toBlob()

  if (!blob || blob.size === 0) {
    throw new Error('El PDF generado está vacío (0 bytes).')
  }

  return blob
}

/** Validates data, generates PDF, and triggers browser download. */
export async function downloadBudgetPdf(budget: Budget): Promise<void> {
  const blob = await generateBudgetPdfBlob(budget)
  const url = URL.createObjectURL(blob)
  const filename = buildQuoteFilename(budget.destination, budget.dateFrom)

  try {
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    link.rel = 'noopener'
    document.body.appendChild(link)
    link.click()
    link.remove()
  } finally {
    URL.revokeObjectURL(url)
  }
}
