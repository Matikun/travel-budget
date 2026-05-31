/** Minimal shape needed to sum line-item prices (watch-friendly). */
export type BudgetPricesInput = {
  flights?: Array<{ priceUsd?: number }>
  hotels?: Array<{ priceUsd?: number }>
  excursions?: Array<{ priceUsd?: number }>
  transfers?: Array<{ priceUsd?: number }>
  carRentals?: Array<{ priceUsd?: number }>
  travelAssistance?: { enabled?: boolean; priceUsd?: number }
}

/**
 * Sums defined line-item prices. Skips undefined and null.
 * Zero is included when explicitly set.
 */
export function calculateTotal(
  prices: Array<number | undefined | null>,
): number {
  return prices.reduce<number>((sum, price) => {
    if (price === undefined || price === null) {
      return sum
    }
    return sum + price
  }, 0)
}

function collectLinePrices(
  items: Array<{ priceUsd?: number }> | undefined,
): Array<number | undefined> {
  return (items ?? []).map((item) => item.priceUsd)
}

/** Collects all optional USD prices from a budget form snapshot. */
export function collectBudgetPrices(
  budget: BudgetPricesInput,
): Array<number | undefined | null> {
  const prices: Array<number | undefined | null> = [
    ...collectLinePrices(budget.flights),
    ...collectLinePrices(budget.hotels),
    ...collectLinePrices(budget.excursions),
    ...collectLinePrices(budget.transfers),
    ...collectLinePrices(budget.carRentals),
  ]

  if (budget.travelAssistance?.enabled) {
    prices.push(budget.travelAssistance.priceUsd)
  }

  return prices
}

/** Estimated total for the full budget form. */
export function calculateBudgetTotal(budget: BudgetPricesInput): number {
  return calculateTotal(collectBudgetPrices(budget))
}

/** True when at least one line item has a defined price (including zero). */
export function budgetHasAnyPrice(budget: BudgetPricesInput): boolean {
  return collectBudgetPrices(budget).some(
    (price) => price !== undefined && price !== null,
  )
}
