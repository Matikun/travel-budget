# Travel Budget

Build travel quotes and itineraries from a form and export a client-ready PDF.

## What it does

- Capture trip header (destination, dates, passengers, optional additional notes) and optional sections: flights (optional departure/arrival date and time per flight), hotels, excursions, transfers, car rentals (pickup/return date, time, and location), travel assistance.
- PDF quotes include a fixed price disclaimer (tariffs as of quote date, subject to change on booking platforms).
- Optional USD prices per line; per-item checkbox to show/hide each line price on the PDF; estimated total with toggles to show/hide the footer total and all line prices at once.
- Optional agency logo (PNG/JPG) in the PDF header; stored globally in the browser, toggled per quote.
- Preview or download a fixed-layout PDF suitable for clients (Spanish copy in UI and PDF).
- Auto-save drafts to `localStorage`; export/import JSON backup.
- Light/dark theme toggle.

## Tech stack

| Layer | Technology |
|-------|------------|
| Package manager | pnpm |
| Build | Vite + React + TypeScript (strict) |
| UI | shadcn/ui + Tailwind CSS |
| Forms | react-hook-form + zod |
| PDF | @react-pdf/renderer |
| Dates | date-fns + Calendar (shadcn) |
| Tests | Vitest + Testing Library |

## Prerequisites

- [Node.js](https://nodejs.org/) 20+
- [pnpm](https://pnpm.io/) 10+

## Scripts

| Command | Description |
|---------|-------------|
| `pnpm dev` | Start dev server |
| `pnpm build` | Production build |
| `pnpm preview` | Preview production build |
| `pnpm test` | Run unit tests once |
| `pnpm test:watch` | Run tests in watch mode |
| `pnpm lint` | ESLint |
| `pnpm typecheck` | TypeScript (`tsc -b --noEmit`) |
| `pnpm format` | Prettier check |
| `pnpm format:write` | Prettier write |
| `pnpm validate` | lint + typecheck + test + build |

## Getting started

```bash
pnpm install
pnpm dev
```

Open the URL shown in the terminal (typically `http://localhost:5173`).

## Documentation

- [Contributing](docs/CONTRIBUTING.md) — feature workflow, commits, pre-commit docs check
- [Implementation plan](docs/IMPLEMENTATION-PLAN.md) — phased delivery and feature status
- [Architecture](docs/ARCHITECTURE.md) — data flow and folder layout
- [PDF QA checklist](docs/PDF-QA-CHECKLIST.md) — manual PDF verification
- [Agency logo plan](docs/LOGO-PDF-IMPLEMENTATION-PLAN.md) — logo on PDF (implemented)

**New features:** update docs in the same commit. Cursor skill: `.cursor/skills/ship-feature/`.

## License

MIT — see [LICENSE](LICENSE).
