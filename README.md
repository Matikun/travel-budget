# Travel Budget

Build travel quotes and itineraries from a form and export a client-ready PDF.

## What it does

- Capture trip header (destination, dates, passengers) and optional sections: flights, hotels, excursions, transfers, travel assistance.
- Optional USD prices per line; estimated total with toggle for PDF visibility.
- Download a fixed-layout PDF suitable for clients (Spanish copy in UI and PDF).

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
| `pnpm validate` | lint + typecheck + test + build |

## Getting started

```bash
pnpm install
pnpm dev
```

Open the URL shown in the terminal (typically `http://localhost:5173`).

## Documentation

- [Implementation plan](docs/IMPLEMENTATION-PLAN.md) — phased delivery
- [Architecture](docs/ARCHITECTURE.md) — data flow and folder layout

## License

MIT — see [LICENSE](LICENSE).
