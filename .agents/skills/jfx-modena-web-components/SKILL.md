---
name: jfx-modena-web-components
description: "Use for work in the jfx-modena-web-components repository: JavaFX Modena source traceability, jfx-* Web Components, component manifests, token generation, viewer verification, scaffolding audits, and certification discipline."
---

# JFX Modena Web Components

Use this skill when working inside this repository. It keeps Codex focused on
source-backed JavaFX Modena parity instead of treating the project as a generic
component library.

## Workflow

1. Read `AGENTS.md` first.
2. Use `README.md` for the current workspace map and status.
3. For component changes, read the component `*.manifest.json` and `*.sources.json`.
4. Use `reference-sources/` as source authority; use `reference-inputs/prototypes/`
   only as non-authoritative comparison material.
5. Keep `jfx-*` names. Do not introduce `modena-*` runtime component names.
6. Regenerate inventories after source/token/component metadata changes:

   ```bash
   npm run compute:tokens
   npm run generate:component-manifests
   npm run validate:components
   ```

7. Run deterministic verification before reporting readiness:

   ```bash
   pnpm typecheck
   pnpm build
   npm run extract:clean-sources -- --dry-run
   ```

8. For viewer/frontend changes, start the viewer with `npm run viewer:dev`, open
   it in a browser, and check console errors.

## Programmatic Prompt Workflow

Use the Codex tooling for repeatable audits instead of hand-written prompts:

```bash
npm run --silent codex:component-profile -- jfx-button
npm run --silent codex:component-context -- jfx-button
npm run --silent codex:audit-component -- jfx-button --print-prompt
```

Only run the full audit without `--print-prompt` when an actual Codex execution
is intended. It uses `codex exec --output-schema schemas/codex-component-audit.schema.json`.

Component profiles are generated. Add override JSON files under
`tools/codex/component-profiles/overrides/` only when a component needs a
workflow, risk flag, source authority, or allowed file exception.

## Certification Guardrails

- No component is certified unless explicit visual, behavior, keyboard/focus,
  accessibility, browser/runtime, and source-traceability gates pass.
- Snapshot or scaffold presence is not certification.
- If popup, menu, tooltip, dialog, focus, keyboard, event, or accessibility parity
  is unverified, report the blocker instead of upgrading status.
- Prefer precise statuses such as `scaffold_only`, `implemented_partial`, or
  `not_certified_behavior_incomplete` over optimistic language.
