import { format } from 'date-fns'

import type { Budget, BudgetFormValues } from '@/lib/schema'

/** Slugifies destination for safe PDF filenames. */
export function slugifyDestination(destination: string): string {
  const slug = destination
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')

  return slug || 'presupuesto'
}

/** Builds download filename: quote-{destination}-{date}.pdf */
export function buildQuoteFilename(
  destination: string,
  dateFrom: Date,
): string {
  const slug = slugifyDestination(destination)
  const datePart = format(dateFrom, 'yyyy-MM-dd')
  return `quote-${slug}-${datePart}.pdf`
}

export function budgetHasFlights(
  budget: Pick<BudgetFormValues, 'flights'>,
): boolean {
  return budget.flights.length > 0
}

export function budgetHasHotels(
  budget: Pick<BudgetFormValues, 'hotels'>,
): boolean {
  return budget.hotels.length > 0
}

export function budgetHasExcursions(
  budget: Pick<BudgetFormValues, 'excursions'>,
): boolean {
  return budget.excursions.length > 0
}

export function budgetHasTransfers(
  budget: Pick<BudgetFormValues, 'transfers'>,
): boolean {
  return budget.transfers.length > 0
}

export function budgetHasCarRentals(
  budget: Pick<BudgetFormValues, 'carRentals'>,
): boolean {
  return budget.carRentals.length > 0
}

export function budgetHasTravelAssistance(
  budget: Pick<BudgetFormValues, 'travelAssistance'>,
): boolean {
  return budget.travelAssistance.enabled
}

/** Whether the PDF footer should show the estimated total. */
export function shouldShowPdfTotal(
  budget: Pick<BudgetFormValues, 'showTotalInPdf'>,
  totalUsd: number,
): boolean {
  return budget.showTotalInPdf && totalUsd > 0
}

/** Whether line-item prices appear in the PDF (totals still use them). */
export function shouldShowIndividualPricesInPdf(
  budget: Pick<BudgetFormValues, 'hideIndividualPricesInPdf'>,
): boolean {
  return !budget.hideIndividualPricesInPdf
}

/** Parsed budget with required header dates (post-validation). */
export function toValidatedBudget(data: BudgetFormValues): Budget | null {
  if (!data.dateFrom || !data.dateTo) {
    return null
  }

  return {
    ...data,
    dateFrom: data.dateFrom,
    dateTo: data.dateTo,
  }
}

export function resolvePdfLogo(
  includeLogoInPdf: boolean,
  logoDataUrl: string | null | undefined,
): string | undefined {
  if (!includeLogoInPdf || !logoDataUrl) {
    return undefined
  }
  return logoDataUrl
}
