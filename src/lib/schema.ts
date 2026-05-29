import { z } from 'zod'

/** Placeholder schema — expanded in Phase 1. */
export const budgetSchema = z.object({
  destination: z.string(),
})

export type Budget = z.infer<typeof budgetSchema>
