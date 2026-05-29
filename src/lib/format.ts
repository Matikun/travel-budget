import { format } from 'date-fns'
import { es } from 'date-fns/locale'

/**
 * Formats a date for UI and PDF (Spanish locale).
 */
export function formatDate(value: Date): string {
  return format(value, 'd MMM yyyy', { locale: es })
}

/**
 * Formats a USD amount for display (en-US locale).
 * Returns empty string when value is undefined or null.
 */
export function formatUsd(value: number | undefined | null): string {
  if (value === undefined || value === null) {
    return ''
  }

  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value)
}
