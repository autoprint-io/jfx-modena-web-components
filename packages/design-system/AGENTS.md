# Design System Guidance

This directory owns Modena tokens, themes, foundations, and generated token CSS.

## Token Rules

- Modena CSS and pinned OpenJFX sources are the visual authority.
- Keep primitive tokens and JavaFX-compatible aliases distinct.
- Precompute values that web CSS cannot derive faithfully at runtime.
- Do not edit generated derived token files by hand unless the generator is broken.
- Preserve compact Modena sizing: padding scales with `em`; borders and insets
  remain pixel-based unless source authority says otherwise.

## Verification

For design-system or token changes:

```bash
npm run compute:tokens
pnpm --filter @jfx-modena/design-system typecheck
pnpm --filter @jfx-modena/design-system build
npm run validate:components
git diff --check
```
