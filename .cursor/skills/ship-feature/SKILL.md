---
name: ship-feature
description: >-
  Ship a user-facing feature in travel-budget with tests and documentation in
  the same commit. Use when implementing new functionality, form/PDF sections,
  schema changes, or when the user asks to commit, document, or deliver a feature.
---

# Ship feature (travel-budget)

End-to-end workflow: code → tests → docs → commit. Docs are **required**, not optional.

## 1. Implement

- Match existing patterns in `src/components/form/`, `src/lib/schema.ts`, `src/components/pdf/`.
- Dynamic sections start **empty**; Spanish UI copy; English code and commit messages.
- Update totals, draft serialization, `row-has-data`, and PDF helpers when the schema grows.

## 2. Test

- Add or extend tests in matching `*.test.ts` files under `src/lib/`.
- Run `pnpm validate` before committing.

## 3. Document (same PR/commit)

Use [docs-map.md](docs-map.md). At minimum:

- `README.md` — “What it does” if operators would notice the change
- `docs/IMPLEMENTATION-PLAN.md` — design decisions, functional requirements, phase tasks, MVP checkboxes
- `docs/ARCHITECTURE.md` — data flow or folder layout if structure changed
- `docs/PDF-QA-CHECKLIST.md` — any PDF-visible behavior

Mark feature-specific plans (e.g. `LOGO-PDF-IMPLEMENTATION-PLAN.md`) as **Implemented** when done.

## 4. Commit

**Format:** Conventional Commits, English, imperative subject (~72 chars).

| Prefix | When |
|--------|------|
| `feat:` / `feat(scope):` | New behavior |
| `fix:` | Bug fix |
| `docs:` | Documentation only |
| `test:` | Tests only |
| `chore:` / `style:` | Tooling, formatting, no behavior |

**Scopes (optional):** `pdf`, `ui`, `form`, `draft`, `schema`

**Body (recommended for features):** one line on *why*; mention doc files updated.

### Examples (this repo)

```
feat: add optional car rental section to form and PDF

Document car rentals in README, architecture, implementation plan, and PDF QA checklist.
```

```
feat(pdf): allow hiding per-item prices in quotes

Update IMPLEMENTATION-PLAN and PDF-QA-CHECKLIST for hideIndividualPricesInPdf toggle.
```

```
docs: sync architecture with car rentals and PDF price visibility
```

## 5. Pre-commit

`pnpm prepare` installs Husky. The pre-commit hook runs `scripts/check-staged-docs.mjs`.

If the hook blocks the commit, stage the listed doc files or set `SKIP_DOC_CHECK=1` only for exceptional cases (no user-facing change).

## Checklist

```
- [ ] Code + tests
- [ ] pnpm validate passes
- [ ] README / docs/ updated per docs-map.md
- [ ] Commit message follows convention; docs in same commit
```
