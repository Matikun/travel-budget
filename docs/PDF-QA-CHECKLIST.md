# PDF visual QA checklist

Manual checks after Phase 3 PDF changes. Run locally with `pnpm dev`, fill the form, and download the PDF.

## Header

- [ ] Destination, date range, and passenger count match the form.
- [ ] Dates use Spanish formatting (e.g. `15 ene 2026`).

## Sections (only when data exists)

- [ ] **Vuelos** omitted when the flights array is empty.
- [ ] Direct flights show “Directo”; layover flights list each escala.
- [ ] **Hoteles** omitted when empty; shows nights and/or date range, room type, breakfast, all inclusive.
- [ ] **Excursiones y tickets** omitted when empty.
- [ ] **Traslados** omitted when empty.
- [ ] **Asistencia al viajero** appears only when the checkbox is enabled.

## Prices & total

- [ ] Line prices right-aligned when present; omitted when blank.
- [ ] Footer total appears only when “Mostrar total en el PDF” is on **and** sum &gt; 0.
- [ ] USD amounts use en-US formatting (e.g. `$1,234.50`).

## Layout & typography

- [ ] A4 page with comfortable margins.
- [ ] Headings use sober navy (`#1e3a5f`); body text readable.
- [ ] Inter font renders (no fallback serif/sans mismatch).
- [ ] Long descriptions wrap without overlapping prices.

## Download flow

- [ ] Invalid form shows validation errors; no download.
- [ ] Valid form downloads `quote-{destination}-{date}.pdf`.
- [ ] Generation failure shows Spanish error message in the form.

## Sample scenarios

1. Header only (no sections) — valid minimal PDF.
2. Two flights (one direct, one with layovers) + prices.
3. Hotel with nights only; hotel with date range only.
4. All sections filled + total shown.
5. Prices blank everywhere — no footer total.

## Logo / branding

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
