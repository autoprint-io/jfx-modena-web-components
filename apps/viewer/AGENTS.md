# Viewer Guidance

This directory owns the visual viewer and future certification dashboard.

## Viewer Rules

- The viewer is evidence support, not certification by itself.
- Keep examples source-backed and label unverified states honestly.
- Do not replace the compact Modena technical feel with generic SaaS styling.
- Register only components that are actually exported and defined by the component package.
- Avoid large dashboard refactors while implementing a single component unless explicitly requested.

## Verification

For viewer changes:

```bash
npm run viewer:dev
```

Open the served page in a browser, verify the target component renders, and check
for console errors. For visual work, capture the relevant state and report what
was actually observed.
