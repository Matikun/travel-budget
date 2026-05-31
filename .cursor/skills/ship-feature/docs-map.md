# Documentation map — travel-budget

Update docs in the **same commit** as the feature.

## Always consider

| File | Update when |
|------|-------------|
| [README.md](../../README.md) | Operators would see new/changed capability |
| [docs/IMPLEMENTATION-PLAN.md](../../docs/IMPLEMENTATION-PLAN.md) | Design decisions, requirements, phase tasks, MVP status |
| [docs/ARCHITECTURE.md](../../docs/ARCHITECTURE.md) | Data flow, modules, folder layout, CSP/PDF pipeline |
| [docs/PDF-QA-CHECKLIST.md](../../docs/PDF-QA-CHECKLIST.md) | Anything visible in downloaded/preview PDF |

## Feature-specific plans

| File | Update when |
|------|-------------|
| [docs/LOGO-PDF-IMPLEMENTATION-PLAN.md](../../docs/LOGO-PDF-IMPLEMENTATION-PLAN.md) | Logo/branding behavior |
| [docs/LOGO-PDF-RESEARCH.md](../../docs/LOGO-PDF-RESEARCH.md) | Add historical note only; do not rewrite research |

## Code → doc triggers

| Code area | Doc focus |
|-----------|-----------|
| `src/lib/schema.ts` | IMPLEMENTATION-PLAN (decisions), ARCHITECTURE, README sections list |
| `src/components/form/*-section.tsx` | README, IMPLEMENTATION-PLAN phases, empty-state copy in QA if PDF-related |
| `src/components/pdf/budget-pdf.tsx` | PDF-QA-CHECKLIST, ARCHITECTURE PDF bullet |
| `src/lib/totals.ts`, `draft.ts`, `pdf-helpers.ts` | ARCHITECTURE, IMPLEMENTATION-PLAN if behavior changes |
| `src/lib/agency-logo.ts`, `pdf-branding-section.tsx` | Logo plan + PDF-QA logo section |

## Usually skip

- Pure refactors with no behavior change
- Dependency bumps (`chore:`)
- Internal test-only changes (`test:`)
- ESLint/Prettier (`style:` / `chore:`)

## Language

| Audience | Language |
|----------|----------|
| README, `docs/`, commits | English |
| UI labels, validation, PDF copy | Spanish |
