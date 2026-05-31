# Contributing — Travel Budget

## Feature workflow

Every **user-facing** change ships with documentation in the **same commit**:

1. Implement code and tests
2. Update docs (see table below)
3. Run `pnpm validate`
4. Commit with [Conventional Commits](https://www.conventionalcommits.org/) (English)

Cursor agents: use the **ship-feature** skill (`.cursor/skills/ship-feature/SKILL.md`).

## What to document

| Change | Files |
|--------|-------|
| New/changed form or PDF section | `README.md`, `docs/IMPLEMENTATION-PLAN.md`, `docs/ARCHITECTURE.md` |
| PDF layout or pricing visibility | `docs/PDF-QA-CHECKLIST.md` |
| Scoped feature (logo, etc.) | Relevant plan under `docs/` |

Full mapping: `.cursor/skills/ship-feature/docs-map.md`.

## Commit messages

```
<type>(<optional scope>): <short summary>

<optional body — why, and which docs were updated>
```

**Types:** `feat`, `fix`, `docs`, `test`, `chore`, `style`

**Scopes:** `pdf`, `ui`, `form`, `draft`, `schema` (optional)

**Examples:**

```
feat(pdf): add car rental section to form and export

Document car rentals in README, architecture, implementation plan, and PDF QA checklist.
```

```
fix(draft): default missing carRentals to empty array
```

```
docs: mark agency logo plan as implemented
```

## Pre-commit hook

After `pnpm install`, Husky runs `scripts/check-staged-docs.mjs` on commit.

If you change feature surfaces (`schema`, form sections, PDF template, totals/draft helpers) without staging `README.md` or any `docs/*.md`, the commit is blocked with a reminder.

Override (rare — no user-facing change): `SKIP_DOC_CHECK=1 git commit ...`

## Quality gate

CI runs `pnpm validate` (lint, typecheck, test, build) on push and PR to `main` / `master`.
