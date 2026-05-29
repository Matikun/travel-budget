/**
 * Sums optional line-item prices. Expanded in Phase 2.
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
