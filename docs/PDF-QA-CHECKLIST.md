# PDF visual QA checklist

Manual checks after Phase 3 PDF changes. Run locally with `pnpm dev`, fill the form, and download the PDF.

## Header

- [ ] Destination, date range, and passenger count match the form.
- [ ] Dates use Spanish formatting (e.g. `15 ene 2026`).
- [ ] **Información adicional** appears below the meta row only when the form field is filled.
- [ ] Price disclaimer appears at the bottom of every PDF (small muted text), matching the copy in the form header section.

## Itinerary layout (`pdfLayout: itinerary`)

- [ ] Title reads **Itinerario de viaje** (budget layout keeps **Presupuesto de viaje**).
- [ ] Single **Itinerario** section with items in date → time → type order (not grouped by service).
- [ ] Day subheadings appear when the calendar date changes (e.g. `10 jun 2026`).
- [ ] Undated flights/hotels appear after all dated items.
- [ ] **Asistencia al viajero** still appears after the timeline, not sorted by date.
- [ ] Excursion/transfer without date blocks PDF when layout is Itinerario (form validation).

## Budget layout (`pdfLayout: budget`)

- [ ] **Vuelos** omitted when the flights array is empty.
- [ ] Direct flights show “Directo”; layover flights list each escala.
- [ ] Flights show optional departure/arrival date and time when filled (Salida / Llegada lines).
- [ ] **Hoteles** omitted when empty; shows nights and/or date range, room type, breakfast, all inclusive.
- [ ] **Excursiones y tickets** omitted when empty; optional **Cuándo** line when date/time filled.
- [ ] **Traslados** omitted when empty; optional **Cuándo** line when date/time filled.
- [ ] **Alquiler de auto** omitted when empty; **Retira** and **Devuelve** lines show date, time, and location; optional description.
- [ ] **Asistencia al viajero** appears only when the checkbox is enabled.

## Prices & total

- [ ] Line prices right-aligned when present; omitted when blank or when hidden (per-item “Mostrar precio en el PDF” off, or global “Ocultar precios por ítem en el PDF” on).
- [ ] Per-item “Mostrar precio en el PDF” unchecked hides that line’s price only; other lines still show when global hide is off.
- [ ] “Ocultar precios por ítem en el PDF” hides all line prices but footer total still reflects them when shown.
- [ ] Footer total appears only when “Mostrar total en el PDF” is on **and** sum &gt; 0.
- [ ] USD amounts use Argentina convention (e.g. `US$ 1.234,50`, not bare `$` or ARS).

## Layout & typography

- [ ] A4 page with comfortable margins.
- [ ] Headings use dark gray (`#111827`); body text readable.
- [ ] Helvetica (built-in PDF font) renders consistently.
- [ ] Long descriptions wrap without overlapping prices.

## Download flow

- [ ] Invalid form shows validation errors; no download.
- [ ] Valid form downloads `quote-{destination}-{date}.pdf`.
- [ ] Generation failure shows Spanish error message in the form.

## Sample scenarios

1. Header only (no sections) — valid minimal PDF; disclaimer present; no “Información adicional” block.
2. Header with additional info text — block appears under meta row before sections.
3. Two flights (one direct, one with layovers) + prices.
4. Hotel with nights only; hotel with date range only.
5. All sections filled + total shown.
6. Prices blank everywhere — no footer total; disclaimer still present.
7. Car rental with pickup/return date, time, and location + price; section omitted when array empty.
8. “Ocultar precios por ítem” on — items without line prices, total still correct when enabled.
9. One flight with “Mostrar precio en el PDF” off, others on — only hidden lines omit price; total includes all.
10. **Itinerario** layout with sample multi-day trip — chronological order; day headings; assistance at end.
11. Itinerario with excursion missing date — form blocks preview/download with Spanish error.
12. Flight/hotel/excursion with photo — image appears in PDF when **Mostrar foto en el PDF** is on.
13. Photo toggle off — PDF row has no image; layout otherwise unchanged.

## Item photos

- [ ] Photo shown only when uploaded and “Mostrar foto en el PDF” is on.
- [ ] No photo → layout matches pre-photo PDF.
- [ ] Large image compressed on upload (max ~150 KB stored per item).

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
