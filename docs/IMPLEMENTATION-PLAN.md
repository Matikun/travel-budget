# Implementation Plan — Travel Budget PDF

Build travel quotes/itineraries from a form and export a client-ready PDF.

---

## Agreed stack

| Layer | Technology |
|-------|------------|
| Package manager | **pnpm** |
| Build | Vite + React + TypeScript (strict) |
| UI | shadcn/ui + Tailwind CSS |
| Forms | react-hook-form + zod |
| PDF | @react-pdf/renderer |
| Dates | date-fns + Calendar (shadcn) |
| Tests | **Vitest** + Testing Library |
| Quality | ESLint + Prettier + `pnpm validate` |
| Deploy | Vercel or Netlify (static) |

**Out of scope v1:** Next.js, backend, database, auth. Agency logo on PDF is in scope — see [`LOGO-PDF-IMPLEMENTATION-PLAN.md`](./LOGO-PDF-IMPLEMENTATION-PLAN.md).

---

## Language & conventions

| Area | Language |
|------|----------|
| README, `docs/`, comments (when needed), commit messages | **English** |
| Code (components, functions, types, file names) | **English** |
| End-user UI (labels, validation messages, PDF copy) | **Spanish** (operators are Spanish-speaking) |

---

## Design decisions (closed)

| Topic | Decision |
|-------|----------|
| Flights & hotels | **Optional.** All dynamic sections start **empty**. User adds items only when needed. Minimum count per section: **0**. |
| Excursions & transfers | Empty by default (unchanged). |
| Car rentals | Empty by default. Each row requires pickup/return dates, times (HH:MM), and locations when present. |
| Empty PDF | Valid if header is filled (destination, dates, passengers). Section blocks render only when they have items (or travel assistance is enabled). Price disclaimer always at the bottom. |
| Prices | Optional per line item. Empty = not included in total. `0` is allowed but treated as explicit zero if entered. |
| Total in PDF | Shown only when `showTotalInPdf` is on **and** at least one price exists. |
| Line prices in PDF | Shown by default per item (`showPriceInPdf`). Each line has a “Mostrar precio en el PDF” checkbox. When `hideIndividualPricesInPdf` is on, all line prices are hidden but still count toward the footer total. |
| PDF export | Requires **valid form** (`trigger()` / full Zod parse) before generate/download. |
| Header dates | `dateFrom <= dateTo`; both required for submit. |
| Passengers | Positive integer, min 1, reasonable max (e.g. 99). |
| Hotels | Either date range **or** night count required **per hotel row** when that row exists (not both mandatory globally). |
| Drafts (`localStorage`) | Key includes schema version: `travel-budget-draft-v1`. Incompatible drafts → offer discard. |
| Package scripts | `pnpm dev`, `pnpm build`, `pnpm test`, `pnpm lint`, `pnpm validate` (lint + typecheck + test + build). |

---

## Functional requirements (summary)

- Header: destination, date from/to, passenger count, optional additional info (notes for the client).
- PDF: optional “Información adicional” block when filled; fixed price disclaimer on every export (`lib/quote-copy.ts`).
- Sections: Flights, Hotels, Excursions/Tickets, Transfer, Car rentals, Travel assistance.
- **Dynamic arrays:** all sections start empty; add/remove freely down to zero items.
- Prices in **USD**, optional per item.
- **Estimated total** computed automatically; toggles to show/hide footer total and all line prices on PDF; per-item checkbox to show/hide each line price.
- Fixed PDF template, professional layout; optional agency logo (header-left) — see [`LOGO-PDF-IMPLEMENTATION-PLAN.md`](./LOGO-PDF-IMPLEMENTATION-PLAN.md) (**implemented**).

---

## Phases

### Phase 0 — Project setup & quality baseline
**Goal:** Repo ready to develop with pnpm, lint, test, and English docs skeleton.

**Tasks:**
- [x] Scaffold Vite (`react-ts`) with **pnpm**.
- [x] Tailwind + shadcn/ui (Button, Input, Label, Card, Separator, Checkbox, Select, Textarea, Calendar, Popover).
- [x] Dependencies: `react-hook-form`, `@hookform/resolvers`, `zod`, `@react-pdf/renderer`, `date-fns`.
- [x] Dev deps: `vitest`, `@testing-library/react`, `@testing-library/jest-dom`, `jsdom`, ESLint, Prettier.
- [x] Folder structure:
  ```
  src/
    components/ui/          # shadcn
    components/form/        # form sections
    components/pdf/         # PDF template
    lib/
      schema.ts             # Zod schemas
      schema.test.ts
      format.ts             # USD, dates
      format.test.ts
      totals.ts
      totals.test.ts
    App.tsx
  docs/
    IMPLEMENTATION-PLAN.md
    ARCHITECTURE.md
  ```
- [x] `package.json` scripts: `dev`, `build`, `test`, `test:watch`, `lint`, `typecheck`, **`validate`**.
- [x] **README.md (English):** prerequisites, install, dev, test, build, project purpose.
- [x] `.github/workflows/ci.yml` (optional): `pnpm validate` on push/PR.
- [x] `LICENSE` if public repo (MIT typical).

**Done when:** `pnpm dev` runs; `pnpm validate` passes (smoke test + empty build); shadcn renders.

**Estimate:** ~3–5 h

---

### Phase 1 — Data model & form (header + flights + hotels)
**Goal:** Core form with optional flights/hotels arrays.

**Tasks:**
- [x] Zod schemas in `lib/schema.ts` (`Budget`, `Flight`, `Hotel`, nested `Layover`, etc.).
- [x] **Default values:** all arrays **empty**; sensible empty header defaults.
- [x] Header UI: destination, date from/to, passengers, optional additional info; price disclaimer in form and PDF.
- [x] **Flights** (`useFieldArray`, starts empty):
  - route, duration, optional departure/arrival date and time, description;
  - type: direct | layovers;
  - if layovers: nested dynamic array (where + duration);
  - optional USD price;
  - add / remove — **minimum 0 flights**.
- [x] **Hotels** (`useFieldArray`, starts empty):
  - name;
  - date from/to **or** night count (at least one per row when filled);
  - room type: standard | double | triple | luxury;
  - breakfast yes/no, all inclusive;
  - optional USD price;
  - add / remove — **minimum 0 hotels**.
- [x] Validation on submit — **messages in Spanish** (UI).
- [x] Responsive layout: cards per section, clear headings.
- [x] **Tests:** `schema.test.ts` (valid/invalid payloads, empty arrays, date rules); optional test for default form values.

**Done when:** Budget with 0 flights / 0 hotels submits; budget with 2 flights + 3 hotels validates; errors visible; `pnpm test` green.

**Estimate:** ~1.5–2.5 days

---

### Phase 2 — Remaining form + live totals
**Goal:** Full form per wireframe; total updates in UI.

**Tasks:**
- [x] **Excursions / Tickets** (empty by default): name, description, optional price.
- [x] **Transfer** (empty by default): from, to, description, optional price.
- [x] **Car rentals** (empty by default): pickup/return dates and times, pickup/return locations, description, optional price.
- [x] **Travel assistance** (optional): include checkbox; description + price when enabled.
- [x] `calculateTotal()` in `lib/totals.ts` — sum defined positive prices only (includes car rentals).
- [x] Sticky bar/card: **Total estimado: USD X,XXX.XX** (`en-US` formatting).
- [x] Checkbox **“Mostrar total en el PDF”** (default on).
- [x] Checkbox **“Ocultar precios por ítem en el PDF”** (default off).
- [x] Price inputs: USD prefix/suffix; positive numbers only.
- [x] **Tests:** `totals.test.ts` — empty, partial prices, assistance on/off, decimals; `format.test.ts` for currency.

**Done when:** All sections exist; total updates live; tests cover edge cases.

**Estimate:** ~1 day

---

### Phase 3 — PDF template & download
**Goal:** Generate and download PDF from validated data.

**Tasks:**
- [x] Register built-in Helvetica font for `@react-pdf/renderer` (no custom font file).
- [x] `BudgetPdf` component — accepts parsed `Budget` type.
- [x] PDF layout:
  - Header: destination, dates, passengers, optional additional info; optional agency logo (top-left); price disclaimer footer.
  - Section blocks **only if items exist** (or assistance enabled).
  - Per item: details + right-aligned price when present and not hidden.
  - Flights: Direct vs layover list.
  - Hotels: nights or date range, room type, breakfast, all inclusive.
  - Car rentals: **Retira** / **Devuelve** lines with date, time, and location each.
  - Footer total only if `showTotalInPdf` && sum > 0.
- [x] Styles: clean list layout in `pdf-styles.ts` (dark gray headings, hairline dividers), A4 margins.
- [x] **Download PDF** — validate form first; `pdf()` → blob → `quote-{destination}-{date}.pdf`.
- [x] Error handling if generation fails (user-facing Spanish message).
- [x] **Tests:** pure helpers for “section has content” / filename slug (if extracted); manual checklist in `docs/` for visual PDF QA.

**Done when:** Valid form → download → PDF matches input; empty sections omitted.

**Estimate:** ~1.5–2 days

---

### Phase 4 — Preview & UX polish
**Goal:** Preview before download; daily-use polish.

**Tasks:**
- [x] Embedded preview (`PDFViewer` or blob in modal/iframe).
- [x] Clear actions: Preview | Download.
- [x] Confirm before removing a row with data.
- [x] Empty states (Spanish): e.g. “Sin vuelos — agregar si corresponde”.
- [x] Accessibility from the start: labels, focus order, contrast.
- [x] Mobile pass on form + preview fallback (download-only if preview heavy).
- [x] **Tests:** one RTL test for a small form section (e.g. add flight row) if stable.

**Done when:** PDF reviewable on screen without downloading first.

**Estimate:** ~0.5–1 day

---

### Phase 5 — Local drafts (recommended)
**Goal:** Survive browser close without losing work.

**Tasks:**
- [x] Persist form to `localStorage` (debounce ~500 ms).
- [x] On load: prompt to restore draft if present (Spanish UI).
- [x] “Nuevo presupuesto” / clear form.
- [x] (Optional) Export/import JSON backup.
- [x] **Tests:** serialize/deserialize round-trip with version key (pure functions in `lib/draft.ts`).

**Done when:** Close tab → reopen → data restored; `pnpm validate` still passes.

**Estimate:** ~0.5 day

---

### Phase 5b — Agency logo on PDF (implemented)

**Goal:** Optional agency logo in PDF header.

**Tasks:** See [`LOGO-PDF-IMPLEMENTATION-PLAN.md`](./LOGO-PDF-IMPLEMENTATION-PLAN.md) — all phases complete.

**Done when:** Upload/remove logo; toggle per quote; preview and download match; `pnpm validate` passes.

---

### Phase 6 — Deploy & handoff
**Goal:** Public URL for real use.

**Tasks:**
- [ ] `pnpm build` clean.
- [ ] Deploy Vercel/Netlify from GitHub.
- [ ] Smoke test PDF in production (Chrome, Edge, Firefox if possible).
- [ ] README: live URL + **short Spanish “how to use”** section for operators.
- [x] Ensure CI runs `pnpm validate` on main (`.github/workflows/ci.yml`).

**Done when:** Stable public URL; PDF works like local.

**Estimate:** ~2–4 h

---

## Phase 7+ — Backlog (post-MVP)

| Item | Description |
|------|-------------|
| Brand | Agency name, colors in PDF and form (logo on PDF done — see logo plan) |
| Templates | PDF variants (with/without prices, itinerary-only) |
| Duplicate quote | Clone data for another client |
| History | Needs backend + auth |
| Multi-currency | ARS + USD |
| Print | `window.print()` on preview |
| Section subtotals | Subtotal flights, hotels, etc. |
| Legal footer | “Prices subject to change” |

---

## Phase dependencies

```mermaid
flowchart LR
  F0[Phase 0 Setup] --> F1[Phase 1 Form core]
  F1 --> F2[Phase 2 Full form]
  F2 --> F3[Phase 3 PDF]
  F3 --> F4[Phase 4 Preview UX]
  F2 --> F5[Phase 5 Drafts]
  F4 --> F6[Phase 6 Deploy]
  F5 --> F6
```

Recommended solo order: **F0 → F1 → F2 → F3 → F4 → F5 → F6** (do not parallelize drafts with preview until schema is stable).

---

## Risks & mitigations

| Risk | Mitigation |
|------|------------|
| PDF layout mismatch | Iterate Phase 3 with real sample; keep snapshot checklist in `docs/` |
| react-pdf CSS limits | Simple flexbox; avoid Grid |
| Long form overwhelm | Collapsible cards in Phase 4 |
| Data loss | Phase 5 + versioned draft key |
| Nested `useFieldArray` (layovers) | Spike in Phase 1; tests for schema; keep nesting shallow |
| Safari / mobile PDF | Test in Phase 6; preview fallback |
| Scope creep | Ship MVP first; backlog items stay in Phase 7+ until core flow works |

---

## MVP definition

- [x] Full form (all sections, all optional except header rules).
- [x] Zero or many flights/hotels/car rentals per quote.
- [x] USD prices + optional total on PDF + optional hide line prices.
- [x] Professional downloadable PDF with preview.
- [x] Optional agency logo on PDF.
- [x] `pnpm validate` green; README + architecture doc in English.
- [ ] Public deploy URL.

**Total estimate (one person):** ~6–9 focused days (includes tests and docs).

---

## Immediate next step

**Phase 6:** Deploy & handoff (Vercel/Netlify, smoke test PDF, README live URL).
