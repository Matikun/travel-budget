# Research — Custom logo in travel budget PDF

**Agent role:** Investigation Agent (research only — no implementation plan)  
**Date:** 2026-05-29  
**Problem:** Allow operators to upload a logo and render it on the exported PDF quote.  
**Downstream use:** Input for a Planning Agent to produce an implementation plan.

---

## 1. Product context

| Aspect | Current state |
|--------|----------------|
| App | Client-only (React + Vite), no backend |
| PDF | `@react-pdf/renderer` v4, template in `src/components/pdf/budget-pdf.tsx` |
| Data | `Budget` / `BudgetFormValues` in `src/lib/schema.ts` — **no logo field** |
| Draft | `localStorage`, key `travel-budget-draft-v1`, version `DRAFT_VERSION = 1` |
| v1 docs | `docs/IMPLEMENTATION-PLAN.md` and `docs/ARCHITECTURE.md` explicitly exclude **“final brand/logo”** |

Current PDF header is text-only (`budget-pdf.tsx`):

- Title: “Presupuesto de viaje”
- Subtitle: “Cotización generada para operadores”
- Then meta row: destination, dates, passengers

Page margins (`pdf-styles.ts`): 48pt horizontal, 40pt top, 48pt bottom. Footer today only shows **estimated total** when applicable — no branding zone.

---

## 2. Where logos are usually placed (industry)

### Dominant patterns (travel agencies / quotes)

| Placement | Typical use | Fit for this PDF |
|-----------|-------------|------------------|
| **Top-left header** | Letterhead, GDS quotes (e.g. Travelport Smartpoint: agency logo **at top** of quote) | **High** — matches professional list layout |
| **Top-center header** | “Magazine” proposals, cover-style docs | Medium — competes with long title + meta |
| **Header: logo left + agency info right** | Classic letterhead | **High** — very common in B2B |
| **Footer** | Contact, social, legal disclaimers | Medium-low for **primary** logo; better for text |
| **Bottom corners** | Page numbers, faint watermark | Low for primary logo |
| **Repeat logo in footer** | Some long emails | **Not recommended** if header logo is already strong |

### References (external)

- Travel itinerary / proposal templates: header acts as digital letterhead (logo + trip/client info).
- Business letterhead guides: logo top-left or top-center; company details opposite or below.
- Tailor Brands / Nielsen Norman: documents favor top-left for recognition.
- Travelport Smartpoint Trip Quote: agency logo at top; PNG/JPG/GIF/TIFF; auto-resize if height &gt; ~65px; footer for custom text below segments.

### Design recommendation (for planning — not a final spec)

For a **list-style** quote (current layout), industry alignment suggests:

```
┌─────────────────────────────────────────────────────────┐
│  [LOGO]     Presupuesto de viaje                        │
│             (meta: destino · fechas · pasajeros)          │
├─────────────────────────────────────────────────────────┤
│  Sections: Vuelos, Hoteles, …                           │
│                                                         │
│                              Total estimado: $X,XXX     │
└─────────────────────────────────────────────────────────┘
```

- **Logo:** upper-left block, capped height (~40–56pt in PDF ≈ 14–20mm).
- **Title + meta:** to the right of logo, or below if logo is wide.
- **Current total footer:** keep separate; avoid crowding logo + total in one undifferentiated block.

**Secondary (v2):** small footer logo only if adding contact/legal block; centered faint watermark — more complex, less expected on travel quotes.

---

## 3. Technical feasibility (current stack)

### `@react-pdf/renderer` — `Image` component

- Supports **PNG and JPG** via URL, `{ uri }`, or **data URL** `data:image/png;base64,...` in the browser.
- **SVG:** limited / unreliable in PDF — assume **not supported** for v1.
- Practical client path: `FileReader` → validate → store data URL → pass to `<Image src={...} />` in `BudgetPdf`.
- Known issues: occasional JPEG quirks in some versions; QA should cover PNG and JPEG; normalizing to PNG on upload is a safe default.

Existing flow already fits:

```
Form (file input) → base64 in state → Budget (with logo?) → BudgetPdf → generateBudgetPdfBlob
```

No backend required if logo is part of validated `Budget` passed to `download-pdf.tsx` / preview dialog.

### Logo storage (no server)

| Option | Pros | Cons |
|--------|------|------|
| Field on `BudgetFormValues` + draft v1 | Single export/import JSON | **Breaks** draft v1 compatibility; inflates `localStorage` |
| Draft **v2** with `logo?: { dataUrl, mimeType }` | Aligns with autosave | Requires `DRAFT_VERSION` bump + migration UX |
| Separate `localStorage` key (e.g. `travel-budget-logo`) | Keeps trip draft small | Logo not in exported trip JSON unless merged |
| IndexedDB | More space for large images | More implementation complexity |

**Practical limit:** `localStorage` ~5MB per origin. A 500KB file → ~670KB base64 string. **Client-side resize/compress before save** is strongly recommended (e.g. max width 400–800px, PNG or JPEG ~0.85 quality).

### CSP and preview

`docs/ARCHITECTURE.md` documents CSP for PDF/WASM. Embedded data URLs in `@react-pdf/renderer` do not need external `connect-src`. PDF preview via blob iframe should work with valid data URLs — verify manually in Chrome/Edge (IDE embedded preview may still be stricter).

---

## 4. Impact on data model and flows

### Schema / types

`budgetFormSchema` currently ends at `showTotalInPdf`. Logo likely needs something like:

- `logo?: { enabled: boolean; dataUrl: string }`, or
- `logoDataUrl?: string | null`

Zod validation: allowed MIME types, max string length, optional prefix check `data:image/(png|jpeg);base64,`.

`toValidatedBudget` in `src/lib/pdf-helpers.ts` should pass logo through to `Budget` used by PDF and preview.

### Form UI (web app)

Natural placement (UX research, not final):

- Section **“PDF”** or block near **“Mostrar total en el PDF”** / before PDF actions.
- Minimum controls: upload, thumbnail preview, remove, help text (PNG/JPG, transparent background recommended).
- **Corner picker not required for v1** if header-left is fixed; left/right toggle is optional v2.

### Draft and JSON import/export

- `exportDraftJson` would include logo → large JSON files.
- Import must validate size and type.
- v1 drafts without logo: treat as incompatible or logo absent on restore (existing `DraftIncompatibleDialog` pattern).

### Tests

- Unit: schema validation with small mock data URL.
- PDF: hard to snapshot; assert `BudgetPdf` renders without throw when logo present/absent.
- Manual: extend `docs/PDF-QA-CHECKLIST.md` with logo scenarios.

---

## 5. Open product decisions

1. **Required vs optional logo?** Almost certainly optional — no logo = current PDF layout.
2. **One global logo per browser vs per budget?** Global = same agency every time; per budget = white-label per client.
3. **Configurable position?** Industry favors header; corners/footer as v2.
4. **Include logo in exported JSON?** Yes = portable backup; no = smaller files + logo only in dedicated storage.
5. **User-facing size limit?** Recommended (e.g. “max 500 KB after optimization”).
6. **Update docs scope** — remove logo from “out of scope v1” in `IMPLEMENTATION-PLAN.md` / `ARCHITECTURE.md` when implementing.

---

## 6. Risks and trade-offs

| Risk | Severity | Notes |
|------|----------|-------|
| Draft v1 incompatible when adding fields | Medium | Bump `DRAFT_VERSION`; reuse incompatible-draft dialog |
| `localStorage` quota with large logos | Medium | Mandatory resize; consider separate key |
| Pixelated logo in PDF | Low | Sufficient source resolution; cap display height, don’t upscale |
| Broken layout with very wide logos | Medium | `maxWidth` + `objectFit` in PDF styles |
| Footer total vs branding footer clash | Low | Keep separate visual blocks |
| JPEG render edge cases | Low | QA; prefer PNG on upload |

---

## 7. Reusable patterns in codebase

| Existing pattern | Reuse for logo |
|------------------|----------------|
| `DraftToolbar` JSON import | Same `input type="file"` + validation flow |
| `showTotalInPdf` | Optional “Include logo in PDF” toggle |
| `src/lib/theme.ts` + `localStorage` | Dedicated logo persistence key |
| `draft.ts` version envelope | Model for `DRAFT_VERSION = 2` |

---

## 8. Success criteria (for Planning Agent)

1. Operator can **upload and remove** a logo (PNG/JPG) from the app, with Spanish copy.
2. Logo appears in **PDF preview** and **download**, in a predictable **header** position (recommended: top-left).
3. With no logo, PDF matches **current output** (no awkward empty placeholder).
4. Logo **persists** across sessions per chosen product rule (draft v2 and/or dedicated storage).
5. Client-side size limits; draft/export does not break on huge files.
6. `pnpm validate` passes; PDF QA checklist updated.

---

## 9. Executive summary

- **Placement:** Travel quotes typically use the **top header** (usually **top-left** or logo-left + text-right), not bottom corners. Footer is better for contact/legal than the main logo.
- **Feasible** with `<Image src={dataUrl} />` and form upload; no backend.
- **Real work** spans schema, persistence (likely **draft v2**), image compression, upload UI, and PDF layout — not PDF alone.
- **Documented as out of scope in v1** — update project docs when this feature is scheduled.

---

## 10. Suggested planning prompt (copy for Planning Agent)

> Read `docs/LOGO-PDF-RESEARCH.md` and produce a phased implementation plan for optional agency logo on the PDF (header-left default). Cover schema, draft migration, form UI, `budget-pdf.tsx` layout, storage limits, tests, and manual QA. Do not implement yet.
