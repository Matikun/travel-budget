# Implementation Plan — Agency logo on PDF

**Agent role:** Planning Agent — Solution Architect (reviewed)  
**Date:** 2026-05-29  
**Input:** `docs/LOGO-PDF-RESEARCH.md`  
**Review:** Review Agent — 2026-05-29 (see §11)  
**Status:** **Approved for execution**  
**Downstream:** Execution Agent → Code Reviewer

---

## 1. Goal

Allow operators to upload an optional agency logo (PNG/JPG) that renders in the **top-left header** of the exported PDF quote, in both preview and download. With no logo or toggle off, the PDF must match today's output exactly.

---

## 2. Product decisions (resolved for v1)

These close the open questions from the research report.

| Decision | v1 choice | Reasoning |
|----------|-----------|-----------|
| Required vs optional | **Optional** | No logo = current layout; no empty placeholder |
| Scope of logo | **Global per browser** (one agency logo) | Matches typical operator workflow; avoids duplicating large base64 in every budget |
| Position | **Fixed header-left** | Industry standard for travel quotes; no corner picker in v1 |
| Include in trip JSON export | **No** (trip JSON unchanged) | Keeps export files small; logo lives in dedicated storage |
| Toggle in form | **`includeLogoInPdf: boolean`** | Mirrors `showTotalInPdf`; operator can disable per quote without deleting logo |
| Draft version bump | **Not required** | Logo stored outside `travel-budget-draft-v1`; trip draft format stays v1 |
| SVG support | **Out of scope** | Unreliable in `@react-pdf/renderer`; accept PNG/JPG only |
| Docs scope | **Update** `IMPLEMENTATION-PLAN.md` and `ARCHITECTURE.md` | Remove logo from “out of scope v1” when scheduled |

---

## 3. Architecture overview

```
┌─────────────────────────────────────────────────────────────────┐
│  Form UI (logo upload + preview + remove + toggle)              │
│       ↓                    ↓                                    │
│  agency-logo.ts      includeLogoInPdf (schema + draft v1)       │
│  localStorage key    travel-budget-draft-v1                     │
│       ↓                    ↓                                    │
│  resolveBudgetForPdf() merges logo at PDF generation time       │
│       ↓                                                         │
│  BudgetPdf → <Image src={dataUrl} /> in header-left layout      │
└─────────────────────────────────────────────────────────────────┘
```

**Key design choice:** Logo binary data is **not** part of `BudgetFormValues` / draft JSON. Only the boolean `includeLogoInPdf` is persisted with the trip. Logo bytes live in `src/lib/agency-logo.ts` with its own storage key, similar to `src/lib/theme.ts`.

At PDF generation time, resolve logo **outside** `Budget` (bytes never enter Zod/schema):

```ts
// src/lib/pdf-helpers.ts
export function resolvePdfLogo(
  includeLogoInPdf: boolean,
  agencyLogo: AgencyLogo | null,
): string | undefined {
  if (!includeLogoInPdf || !agencyLogo?.dataUrl) return undefined
  return agencyLogo.dataUrl
}
```

Call sites read storage once per preview/download:

```ts
const logoDataUrl = resolvePdfLogo(
  getValues().includeLogoInPdf,
  readStoredAgencyLogo(),
)
```

**PDF pipeline (correct file ownership):**

| Step | File | Responsibility |
|------|------|----------------|
| Validate form | `budget-form.tsx` → `resolveBudgetForPdf()` | Returns `Budget` (local function, **not** in `pdf-helpers.ts`) |
| Resolve logo | `pdf-helpers.ts` → `resolvePdfLogo()` | Toggle + storage → `logoDataUrl?` |
| Render | `download-pdf.tsx` → `generateBudgetPdfBlob(budget, logoDataUrl?)` | Passes both to `<BudgetPdf />` |
| Preview | `pdf-preview-dialog.tsx` | Receives `logoDataUrl?` prop; same blob API as download |

Do **not** add `logoDataUrl` to `Budget` / `BudgetFormValues`.

---

## 4. Phases and milestones

### Phase 0 — Prerequisites (Execution Agent, ~15 min)

- [ ] Read this plan and `docs/LOGO-PDF-RESEARCH.md`
- [ ] Confirm no new npm dependencies unless canvas resize is needed without one (prefer native `Canvas` + `createImageBitmap` or `<canvas>` for resize — **no new dependency** for v1)

**Milestone:** Approach agreed; branch or worktree ready.

---

### Phase 1 — Data layer and image processing

**Files:** `src/lib/agency-logo.ts` (new), `src/lib/schema.ts`, `src/lib/draft.ts`

#### 1.1 Agency logo module (`src/lib/agency-logo.ts`)

Create a small module modeled after `theme.ts`:

| Export | Purpose |
|--------|---------|
| `AGENCY_LOGO_STORAGE_KEY` | e.g. `'travel-budget-agency-logo-v1'` |
| `AgencyLogo` type | `{ dataUrl: string; mimeType: 'image/png' \| 'image/jpeg'; updatedAt: string }` |
| `readStoredAgencyLogo()` | Parse from `localStorage`; return `null` if missing/invalid |
| `writeStoredAgencyLogo(logo)` | Persist envelope JSON |
| `clearStoredAgencyLogo()` | Remove on “Quitar logo” |
| `processLogoFile(file: File): Promise<AgencyLogo>` | Validate, resize, compress, return data URL |

**Validation rules in `processLogoFile`:**

- Accept MIME: `image/png`, `image/jpeg` only (reject others with Spanish error)
- Max upload size before processing: **2 MB** (user-facing message)
- After processing: target max width **600px**, max height **600px** (preserve aspect ratio)
- Output: prefer **PNG** if source has transparency; else **JPEG quality ~0.85**
- Max stored data URL length: **~400 KB** encoded (~300 KB binary) — reject with Spanish error if still too large after resize

**Implementation notes:**

- Use `FileReader.readAsDataURL` for initial read
- Resize via offscreen `<canvas>` (browser-only; guard `typeof window`)
- Do not store raw `File` objects

#### 1.2 Schema — toggle only

In `src/lib/schema.ts`:

```ts
includeLogoInPdf: z.boolean()
```

- Add to `budgetBaseSchema` as `includeLogoInPdf: z.boolean().default(false)` (`.default(false)` ensures old draft JSON without the key still parses via `budgetFormSchema.safeParse` in `parseDraftJson`)
- Update `defaultBudgetValues()`, `sampleBudgetValues()`, and **all** test fixtures in `schema.test.ts`, `draft.test.ts`, `pdf-helpers.test.ts`
- `freshBudgetValues()` delegates to `defaultBudgetValues()` — no extra change needed
- Schema default `false`; on successful upload set `includeLogoInPdf: true` in the form handler

#### 1.3 Draft compatibility

In `src/lib/draft.ts`:

- **Do not bump** `DRAFT_VERSION` or `DRAFT_STORAGE_KEY`
- Extend `draftHasContent()` — when toggle is on, treat as user intent (opposite polarity to `showTotalInPdf`):

```ts
if (values.includeLogoInPdf) {
  return true
}
```

(`showTotalInPdf` uses `if (!values.showTotalInPdf) return true` because default is `true`. Logo default is `false`, so check the positive case.)

**Milestone:** Unit tests for logo module + schema/draft pass.

---

### Phase 2 — Form UI

**Files:** `src/components/form/pdf-branding-section.tsx` (new), `src/components/form/budget-form.tsx`, optionally `estimated-total-bar.tsx`

#### 2.1 New section component

Create `PdfBrandingSection` and render it in `budget-form.tsx` **inside the main Card**, immediately **before** the “Acciones del PDF” button group (~line 338), with a `<Separator />` above it. Keep `EstimatedTotalBar` sticky at bottom (total toggle stays there; logo toggle lives in branding section).

**Controls (Spanish copy):**

| Control | Behavior |
|---------|----------|
| File input | `accept="image/png,image/jpeg,.png,.jpg,.jpeg"`, hidden + button “Subir logo” |
| Thumbnail | Show current logo (~48–64px height) when stored |
| Remove | “Quitar logo” → `clearStoredAgencyLogo()`, clear local preview state, set `includeLogoInPdf` to `false` |
| Toggle | Checkbox “Incluir logo en el PDF” bound to `includeLogoInPdf` |
| Help text | “PNG o JPG. Fondo transparente recomendado. Máx. ~500 KB después de optimizar.” |
| Error | Inline alert for validation failures (type, size) |

**State model:**

- Local React state: `agencyLogo: AgencyLogo | null` initialized from `readStoredAgencyLogo()` on mount
- On successful upload: update state + `writeStoredAgencyLogo()` + `setValue('includeLogoInPdf', true)`
- Toggle disabled (with helper text) when no logo stored

#### 2.2 Wire into `budget-form.tsx`

- Import and render `PdfBrandingSection` in the form layout (after travel sections, before sticky total bar or integrated in the PDF action card)
- On “Nuevo presupuesto”: **keep** global logo (do not clear agency logo — it's agency-wide)
- Autosave draft continues to persist `includeLogoInPdf` only

**Milestone:** Manual smoke — upload PNG, toggle on/off, refresh page, logo persists.

---

### Phase 3 — PDF layout

**Files:** `src/components/pdf/budget-pdf.tsx`, `src/components/pdf/pdf-styles.ts`, `src/lib/pdf-helpers.ts`, `src/lib/download-pdf.tsx`, `src/components/form/pdf-preview-dialog.tsx`

#### 3.1 Props and helpers

- Extend `BudgetPdf` props:

```ts
type BudgetPdfProps = {
  budget: Budget
  logoDataUrl?: string
}
```

- Add `resolvePdfLogo` in `pdf-helpers.ts` (see §3)
- Extend `generateBudgetPdfBlob` and `downloadBudgetPdf`:

```ts
export async function generateBudgetPdfBlob(
  budget: Budget,
  logoDataUrl?: string,
): Promise<Blob>
```

- In `budget-form.tsx`, extend local `resolveBudgetForPdf` result **or** resolve logo in `handlePreviewPdf` / `handleDownloadPdf` after budget validation:

```ts
type BudgetPdfResult =
  | { ok: true; budget: Budget; logoDataUrl?: string }
  | { ok: false; error: PdfErrorInfo }
```

- `PdfPreviewDialog`: add prop `logoDataUrl?: string`; include in `useEffect` deps `[open, budget, logoDataUrl]`; pass to `generateBudgetPdfBlob(budget, logoDataUrl)`
- `handleDownloadPdf`: pass the same `logoDataUrl` to `downloadBudgetPdf(budget, logoDataUrl)`

#### 3.2 Header layout (letterhead)

Replace flat header block with conditional row layout:

```
┌──────────────────────────────────────────────────┐
│ [LOGO 48pt h]  │  Presupuesto de viaje           │
│  max 120pt w   │  Cotización generada…           │
├──────────────────────────────────────────────────┤
│ meta row (unchanged)                             │
```

**When `logoDataUrl` is absent:** render **exactly** the current header (no spacer, no empty box).

**When present:**

- Import `Image` from `@react-pdf/renderer`
- New styles in `pdf-styles.ts`:

```ts
headerRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 16 }
logo: { height: 48, maxWidth: 120, objectFit: 'contain' as const }
headerText: { flex: 1 }
```

If `objectFit` is ignored by the installed `@react-pdf/renderer` v4 build, rely on fixed `height` + `maxWidth` only (QA item).

- Wrap existing title/subtitle in `headerText` column
- Keep `metaRow`, sections, and footer **unchanged**
- Footer total block stays separate (no logo in footer in v1)

#### 3.3 Preview and download paths

Ensure both code paths pass the same `logoDataUrl`:

- `pdf-preview-dialog.tsx`
- `download-pdf.tsx` / `generateBudgetPdfBlob`

**Milestone:** PDF with logo matches wireframe; PDF without logo is pixel-identical to pre-change output.

---

### Phase 4 — Tests

**Files:** new `src/lib/agency-logo.test.ts`, updates to `schema.test.ts`, `draft.test.ts`, `pdf-helpers.test.ts`, optional smoke test for `BudgetPdf`

| Test | Assert |
|------|--------|
| `processLogoFile` | Rejects non-image MIME; accepts small PNG fixture |
| `readStoredAgencyLogo` | Round-trip write/read; invalid JSON → null |
| Schema | `includeLogoInPdf` defaults and parses |
| Draft | Old envelope without field gets default; `draftHasContent` with toggle true |
| `resolvePdfLogo` | Returns undefined when toggle off or no logo; returns dataUrl when both on |
| `BudgetPdf` | Renders without throw when `logoDataUrl` present/absent (smoke via `@react-pdf/renderer` renderToBuffer if feasible, else shallow render test) |

**Milestone:** `pnpm validate` passes.

---

### Phase 5 — Documentation and manual QA

**Files:** `docs/PDF-QA-CHECKLIST.md`, `docs/IMPLEMENTATION-PLAN.md`, `docs/ARCHITECTURE.md`

#### 5.1 PDF QA checklist additions

Add section **Logo / branding**:

- [ ] No logo → header identical to pre-feature PDF
- [ ] PNG with transparency renders correctly
- [ ] JPEG logo renders correctly
- [ ] Wide logo respects `maxWidth`; tall logo respects `height: 48`
- [ ] Toggle off → no logo in PDF even if uploaded
- [ ] Remove logo → preview/download without logo
- [ ] Logo persists after page reload
- [ ] New budget keeps stored logo; toggle resets per form default logic
- [ ] PDF preview (dialog) and download match
- [ ] Chrome and Edge (blob iframe)

#### 5.2 Project docs

- Remove “final brand/logo” from out-of-scope in `IMPLEMENTATION-PLAN.md`
- Update `ARCHITECTURE.md` out-of-scope: branding partially in scope (logo only); note `agency-logo.ts` storage
- Add short cross-link from `IMPLEMENTATION-PLAN.md` to this file

**Milestone:** QA checklist complete; docs consistent.

---

## 5. File change summary

| File | Action |
|------|--------|
| `src/lib/agency-logo.ts` | **Create** — storage, validation, resize |
| `src/lib/agency-logo.test.ts` | **Create** |
| `src/lib/schema.ts` | **Edit** — `includeLogoInPdf` |
| `src/lib/draft.ts` | **Edit** — `draftHasContent` |
| `src/lib/pdf-helpers.ts` | **Edit** — `resolvePdfLogo` |
| `src/lib/pdf-helpers.test.ts` | **Edit** |
| `src/lib/schema.test.ts` | **Edit** |
| `src/lib/draft.test.ts` | **Edit** |
| `src/components/form/pdf-branding-section.tsx` | **Create** |
| `src/components/form/budget-form.tsx` | **Edit** — wire section + PDF merge |
| `src/components/pdf/budget-pdf.tsx` | **Edit** — header + Image |
| `src/components/pdf/pdf-styles.ts` | **Edit** — logo styles |
| `src/components/form/pdf-preview-dialog.tsx` | **Edit** — `logoDataUrl` prop + effect deps |
| `src/lib/download-pdf.tsx` | **Edit** — optional `logoDataUrl` on blob/download APIs |
| `docs/PDF-QA-CHECKLIST.md` | **Edit** |
| `docs/IMPLEMENTATION-PLAN.md` | **Edit** |
| `docs/ARCHITECTURE.md` | **Edit** |

**Estimated touch count:** ~15 files, no new dependencies.

---

## 6. Risks and mitigations

| Risk | Mitigation |
|------|------------|
| `localStorage` quota exceeded | Mandatory resize/compress; cap ~400 KB stored; clear error in Spanish |
| Wide logo breaks header | `maxWidth: 120`, `objectFit: 'contain'`, flex row |
| JPEG render quirks in react-pdf | QA both formats; normalize transparent PNGs to PNG output |
| Old drafts missing new boolean field | `.default(false)` on parse path |
| Logo lost on JSON export/import | Document v1 limitation; v2 could add optional logo block in export envelope |
| Canvas unavailable in tests | Mock `processLogoFile` or test pure validation/parsing only in unit tests |

---

## 7. Out of scope (v2 backlog)

- Logo position picker (left/right/center/footer)
- Per-budget logo (white-label per quote)
- Logo embedded in JSON export/import
- SVG upload
- IndexedDB for very large assets
- Footer contact block + secondary watermark logo
- `DRAFT_VERSION = 2` migration

---

## 8. Success criteria (from research → acceptance)

1. Operator can **upload and remove** a logo (PNG/JPG) with Spanish UI copy
2. Logo appears in **PDF preview and download** at **header-left**
3. Without logo or with toggle off, PDF matches **current output**
4. Logo **persists across sessions** (global storage); toggle persists in trip draft
5. Client-side size limits enforced; no silent failures on huge files
6. `pnpm validate` passes; `PDF-QA-CHECKLIST.md` updated

---

## 9. Execution order (for Execution Agent)

Strict sequence to minimize rework:

1. Phase 1 — `agency-logo.ts` + tests
2. Phase 1 — schema + draft updates + tests
3. Phase 3 — PDF layout (can develop with hardcoded test data URL before UI)
4. Phase 2 — form UI wired to storage and toggle
5. Phase 3 — connect preview/download paths end-to-end
6. Phase 4 — remaining tests
7. Phase 5 — docs + manual QA
8. Run `pnpm validate`

---

## 10. Review checklist (Review Agent — 2026-05-29)

- [x] Global logo vs per-budget — acceptable for v1 agency workflow
- [x] Draft v1 preserved — `z.boolean().default(false)` on schema; no version bump
- [x] Header degrades — capped dimensions + conditional branch (no spacer when absent)
- [x] No placeholder when absent — explicit requirement in §3.2
- [x] JSON export — documented limitation (§7)
- [x] Storage tests — round-trip + invalid JSON; canvas tests mocked or fixture-only
- [x] Spanish errors — catalog in §12

---

## 11. Review Agent report (incorporated)

### Strengths

- Clear separation: logo bytes in `agency-logo.ts`, toggle in draft/schema only
- Execution order (data → PDF shell → UI → wire paths) minimizes rework
- Matches existing patterns (`theme.ts`, `showTotalInPdf`, `EstimatedTotalBar`)
- No new dependencies; realistic size limits

### Issues fixed in this revision

| Issue | Fix |
|-------|-----|
| Plan referenced `resolveBudgetForPdf` in `pdf-helpers.ts` | Corrected: local function in `budget-form.tsx`; logo helper is `resolvePdfLogo` in `pdf-helpers.ts` |
| Preview/download path underspecified | Added `generateBudgetPdfBlob(budget, logoDataUrl?)`, `PdfPreviewDialog` prop, effect deps |
| `draftHasContent` polarity unclear | Explicit `if (values.includeLogoInPdf) return true` |
| Draft migration vague | Single approach: `.default(false)` on `budgetBaseSchema` |
| UI placement ambiguous | Exact slot: before PDF buttons inside Card |

### Risks (unchanged, monitor in QA)

- `localStorage` quota — mitigated by resize cap
- jsdom canvas in unit tests — test parsing/storage; mock `processLogoFile` resize path or use tiny PNG fixture with guarded skip
- Preview stale if logo changes while dialog open — acceptable v1; closing dialog clears state

### Recommendations applied

- Centralize logo resolution in `resolvePdfLogo`
- Pass `logoDataUrl` parallel to `budget`, not embedded in `Budget` type
- Run `pnpm validate` as final gate (Execution Agent)

---

## 12. Spanish user-facing messages (catalog)

| Case | Message |
|------|---------|
| Wrong MIME | `Solo se permiten imágenes PNG o JPG.` |
| File too large (pre-process) | `El archivo supera el tamaño máximo de 2 MB.` |
| Still too large after resize | `La imagen sigue siendo demasiado grande. Probá con un archivo más pequeño o con menos detalle.` |
| Read/process failure | `No se pudo procesar la imagen. Intentá con otro archivo.` |
| `localStorage` write failure | `No se pudo guardar el logo. Liberá espacio en el navegador o quitá datos antiguos.` |
| Toggle disabled (no logo) | Helper: `Subí un logo para incluirlo en el PDF.` |

---

*End of plan — approved for Execution Agent.*
