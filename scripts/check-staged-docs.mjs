#!/usr/bin/env node
/**
 * Pre-commit: if staged changes touch user-facing feature surfaces,
 * require README.md or docs/*.md in the same commit.
 *
 * Skip: SKIP_DOC_CHECK=1
 */

import { execSync } from 'node:child_process'

if (process.env.SKIP_DOC_CHECK === '1') {
  process.exit(0)
}

const staged = execSync('git diff --cached --name-only', {
  encoding: 'utf8',
})
  .trim()
  .split('\n')
  .filter(Boolean)

if (staged.length === 0) {
  process.exit(0)
}

const FEATURE_PATTERNS = [
  /^src\/lib\/schema\.ts$/,
  /^src\/components\/pdf\/budget-pdf\.tsx$/,
  /^src\/lib\/totals\.ts$/,
  /^src\/lib\/draft\.ts$/,
  /^src\/lib\/pdf-helpers\.ts$/,
  /^src\/lib\/agency-logo\.ts$/,
  /^src\/components\/form\/[^/]+-section\.tsx$/,
]

const DOC_PATTERNS = [/^README\.md$/, /^docs\/.+\.md$/]

const touchesFeature = staged.some((file) =>
  FEATURE_PATTERNS.some((pattern) => pattern.test(file)),
)

const touchesDocs = staged.some((file) =>
  DOC_PATTERNS.some((pattern) => pattern.test(file)),
)

if (touchesFeature && !touchesDocs) {
  console.error(`
✗ Documentation required for this commit.

Staged changes touch user-facing feature code but no docs are staged.

Stage at least one of:
  - README.md
  - docs/*.md

See docs/CONTRIBUTING.md and .cursor/skills/ship-feature/docs-map.md

To bypass (no user-facing change): SKIP_DOC_CHECK=1
`)
  process.exit(1)
}

process.exit(0)
