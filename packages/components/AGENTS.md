# Components Guidance

This directory owns `jfx-*` Web Components, component manifests, source maps,
templates, styles, and component tests.

## Before Editing

- Read the target component `*.manifest.json` and `*.sources.json`.
- Read relevant source authority under `reference-sources/` before mapping behavior.
- Read a sibling implemented component before inventing structure. Prefer `jfx-button`
  and `jfx-label` as current local patterns.
- Treat `reference-inputs/prototypes/` as non-authoritative comparison material only.

## Component Scope

- Keep first passes minimal, shippable, and source-backed.
- Do not attempt full JavaFX parity in one pass for complex inherited behavior.
- Update implementation, template, styles, manifest, and tests together when behavior changes.
- Do not mark a component certified. Certification requires source, visual, behavior,
  keyboard/focus, accessibility, and browser/runtime evidence.
- Do not hand-edit `src/component-status.json`; regenerate it.

## Verification

For component changes, run the narrowest useful test first, then the structural checks:

```bash
pnpm --filter @autoprint/jfx-modena-components test
pnpm typecheck
pnpm build
npm run generate:component-manifests
npm run validate:components
npm run extract:clean-sources -- --dry-run
git diff --check
```

`pnpm test` now includes real component Playwright tests for implemented controls,
while other packages may still contain placeholder package-level tests.
