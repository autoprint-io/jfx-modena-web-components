---
name: jfx-component-first-pass
description: "Use when implementing one jfx-* Web Component from scaffold or partial state. Keeps the pass source-backed, minimal, tested, and explicitly not certified."
---

# JFX Component First Pass

Use this skill for one component at a time. The goal is a narrow,
source-backed first implementation, not full JavaFX parity.

## Inputs

- Component tag, for example `jfx-checkbox`.
- Optional scope limits from Vinny.
- Existing Codex stage outputs only as planning context, never as source authority.

## Workflow

1. Read `AGENTS.md` and `packages/components/AGENTS.md`.
2. Read the target component `*.manifest.json`, `*.sources.json`, current
   implementation/template/styles/tests, and sibling implemented controls.
3. Run or inspect read-only stages when useful:

   ```bash
   npm run --silent codex:source-traceability -- <component> --full-sources --output .codex-runs/<component>-source-traceability.json
   npm run --silent codex:certification-profile -- <component> --full-sources --output .codex-runs/<component>-certification-profile.json
   npm run --silent codex:component-plan -- <component> --full-sources --output .codex-runs/<component>-implementation-plan.json
   ```

4. Implement only the first useful slice: host element, attributes/properties,
   template, Modena-aligned styles, and focused tests.
5. Leave complex JavaFX behavior as explicit blockers in the manifest or final
   report instead of implying parity.
6. Regenerate generated component status; do not hand-edit it.

## Verification

Run the narrow test first, then structural checks:

```bash
pnpm --filter @autoprint/jfx-modena-components test
pnpm typecheck
pnpm build
npm run generate:component-manifests
npm run validate:components
npm run extract:clean-sources -- --dry-run
git diff --check
```

Report exact commands and exit codes. Do not claim certification.
