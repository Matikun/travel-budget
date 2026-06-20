# Implementation Plan — Chronological itinerary PDF & item photos

**Date:** 2026-06-20  
**Status:** **PR1 implemented** (2026-06-20) · PR2 photos planned  
**Delivery:** Two separate PRs — PR1 itinerary, PR2 photos

---

## 1. Goals

1. **Chronological itinerary PDF** — A second PDF layout that presents all trip items in date/time order (timeline), while keeping the existing **budget** layout (grouped by service type) unchanged.
2. **Optional photos** — Allow one optional photo per flight, hotel, and excursion row, rendered in the PDF when uploaded and enabled.

---

## 2. Product decisions (closed)

| Topic | Decision |
|-------|----------|
| Itinerary grouping | **Chronological only** — no tramos / destination blocks |
| PDF layouts | **`budget`** (default, current) and **`itinerary`** (new) |
| Form structure | **Keep flat sections** (Vuelos, Hoteles, Excursiones, …) — no tramo selector |
| Excursion / transfer dates | **Optional in budget mode**; **required when generating or previewing itinerary PDF** if that row has data |
| Items without date in itinerary mode | **Block PDF** (validation error) — do not silently omit or append “Sin fecha” |
| Travel assistance | **After the timeline**, not sorted by date (same as today: single block at end) |
| Car rentals | Included in chronological timeline using existing `dateFrom` + `timeFrom` |
| Flights / hotels | Use existing `dateFrom` (+ `timeFrom` where present) |
| Photos scope (v1) | Flights, hotels, excursions only — **not** transfers or car rentals |
| Photos per item | **One** optional image; checkbox **“Mostrar foto en el PDF”** (default on when photo present) |
| Photo storage | Embedded in draft JSON as compressed data URL (reuse resize/compress patterns from `agency-logo.ts`) |
| Delivery | **PR1:** itinerary layout + dates + validation · **PR2:** photos |

---

## 3. Chronological vs budget layout

### Budget (current — unchanged)

```
Vuelos
  · Vuelo 1 …
  · Vuelo 2 …
Hoteles
  · Hotel 1 …
Excursiones y tickets
  · …
Traslados / Autos / Asistencia …
Total
```

### Itinerary (new)

Single ordered list by **date → time → type tie-break**:

```
10 jun 2026 — 08:30 · Vuelo: BUE → BRC …
10 jun 2026 · Hotel: Llao Llao …
11 jun 2026 · Excursión: Circuito Chico …
14 jun 2026 — 14:15 · Vuelo: BRC → MDZ …
…
Asistencia al viajero (if enabled)
Total
```

**Sort key (per item):**

1. `dateFrom` or `date` (start of day if no time)
2. `timeFrom` or `time` when present
3. Type order tie-break (same day): flight → hotel → excursion → transfer → car rental

**Travel assistance:** always rendered after all timed items, before footer total.

---

## 4. Schema changes

### PR1 — Itinerary

```ts
pdfLayout: z.enum(['budget', 'itinerary']).default('budget')

// excursionSchema — add:
date: z.date().optional()
time: timeOfDaySchema.optional()

// transferSchema — add:
date: z.date().optional()
time: timeOfDaySchema.optional()
```

**Conditional validation** (superRefine on `budgetFormSchema` or dedicated helper used before PDF):

When `pdfLayout === 'itinerary'`:

- Each excursion row with data (`excursionHasData`) must have `date`.
- Each transfer row with data must have `date`.

When `pdfLayout === 'budget'`: dates on excursions/transfers remain optional.

### PR2 — Photos

```ts
// flightSchema, hotelSchema, excursionSchema — add:
photoDataUrl: z.string().optional() // data:image/png|jpeg;base64,…
showPhotoInPdf: z.boolean().default(true)
```

Reuse MIME/size limits similar to agency logo (compress on upload; cap stored length per item).

### Draft migration

Bump **`DRAFT_VERSION` to `2`** in PR1 (new fields + `pdfLayout` default).

- PR1 migration: add `pdfLayout: 'budget'`, `date`/`time` undefined on excursions/transfers.
- PR2 migration: add `photoDataUrl` undefined, `showPhotoInPdf: true` on applicable rows.

---

## 5. PR1 — Chronological itinerary (first PR)

### Tasks

- [x] Schema: `pdfLayout`, excursion/transfer `date` + optional `time`
- [x] Conditional Zod validation for itinerary mode (Spanish messages)
- [x] Form: date (+ optional time) pickers on excursion and transfer rows
- [x] Form: toggle **“Vista PDF: Presupuesto / Itinerario”** (near preview/download)
- [x] `lib/itinerary.ts`: `buildItineraryItems(budget)` — pure sort + typed union for render
- [x] `lib/itinerary.test.ts`: sort order, tie-breaks, missing-date guard
- [x] PDF: extract shared item renderers or add `ItineraryPdf` section in `budget-pdf.tsx`
- [x] PDF: day grouping optional (subheading when date changes — nice-to-have in v1)
- [x] Preview + download respect `pdfLayout`; block with form errors if itinerary invalid
- [x] Draft v2 serialize/parse + migration from v1
- [x] Docs: README, IMPLEMENTATION-PLAN, ARCHITECTURE, PDF-QA-CHECKLIST

### Files (expected)

| Path | Change |
|------|--------|
| `src/lib/schema.ts` | New fields + itinerary validation |
| `src/lib/itinerary.ts` | Sort/build timeline items |
| `src/lib/draft.ts` | Version 2 + migration |
| `src/components/form/excursions-section.tsx` | Date/time inputs |
| `src/components/form/transfers-section.tsx` | Date/time inputs |
| `src/components/form/budget-form.tsx` | Layout toggle |
| `src/components/pdf/budget-pdf.tsx` | Branch on `pdfLayout` |
| `src/lib/row-has-data.ts` | Excursion/transfer date not required for “has data” |

### Done when

- Toggle itinerary → PDF shows single chronological list; budget PDF unchanged
- Excursion/transfer without date → validation error in itinerary mode only
- Travel assistance after timeline
- `pnpm validate` green

---

## 6. PR2 — Item photos (second PR)

### Tasks

- [ ] Schema: `photoDataUrl` + `showPhotoInPdf` on flight, hotel, excursion
- [ ] `lib/item-photo.ts` (or extend `agency-logo.ts` utilities): upload, resize, compress, validate size
- [ ] Form: image input + preview + remove per row (flights, hotels, excursions)
- [ ] PDF: render `<Image />` when `showPhotoInPdf` and data URL present (both layouts)
- [ ] Draft v2 already exists — extend migration for photo fields
- [ ] Tests: photo field defaults, PDF helper “should show photo”
- [ ] Docs update + PDF-QA scenarios with/without photos

### Photo PDF layout (v1 proposal)

- Thumbnail ~120×80 pt to the right of title block, or full-width below title if no price column conflict
- Max one image; omit row image area when empty

### Done when

- Optional photo on flight/hotel/excursion rows
- Photos appear in budget and itinerary PDFs when enabled
- Draft round-trip with photos under size cap
- `pnpm validate` green

---

## 7. PDF QA checklist additions (both PRs)

### Itinerary

- [ ] Toggle “Itinerario” produces chronological list, not grouped sections
- [ ] Same-day items ordered by time, then type tie-break
- [ ] Excursion/transfer without date blocks PDF in itinerary mode with Spanish error
- [ ] Travel assistance appears after all dated items
- [ ] Budget layout unchanged when toggle is “Presupuesto”

### Photos

- [ ] Photo shown only when uploaded and “Mostrar foto en el PDF” is on
- [ ] No photo → layout matches pre-photo PDF
- [ ] Large image compressed; draft save does not exceed reasonable localStorage size

---

## 8. Out of scope (v1)

- Tramos / destination grouping
- Multiple photos per item
- Photos on transfers or car rentals
- Drag-and-drop reorder
- Auto-infer excursion date from hotel stay

---

## 9. Suggested branch / commit names

**PR1**

```
feat(pdf): add chronological itinerary layout and excursion/transfer dates
```

**PR2**

```
feat(pdf): add optional photos on flights, hotels, and excursions
```

---

## 10. Dependency

PR2 can branch from main after PR1 merges (recommended). PR2 only touches photo fields and PDF image render — no conflict with itinerary sort logic if merged sequentially.
