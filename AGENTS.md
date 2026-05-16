# AGENTS.md

## Project Identity

This repository is a frameworkless Web Components port of JavaFX Modena controls.
It is source-traceable scaffolding plus early implementation work, not a certified
component library.

Use English for code, docs, prompts, comments, manifests, commits, and skills.
Use Spanish only for end-user runtime UI strings and direct conversation with Vinny.

## Source Authority

Resolve implementation conflicts in this order:

1. Pinned OpenJFX source and Modena CSS in `reference-sources/openjfx/`.
2. Scene Builder fixtures in `reference-sources/scenebuilder/`.
3. JavaFX CSS reference in `reference-sources/docs/`.
4. Prototype material under `reference-inputs/prototypes/` as non-authoritative reference only.

Never claim JavaFX/Modena certification from scaffolds, snapshots, generated manifests,
or visual similarity alone. Certification requires explicit source, visual, behavior,
keyboard/focus, accessibility, and browser/runtime evidence.

## Repository Map

- `apps/viewer`: visual viewer and future certification dashboard.
- `packages/runtime`: shared custom-element and runtime primitives.
- `packages/design-system`: Modena tokens, foundations, themes, and CSS variables.
- `packages/components`: `jfx-*` Web Components, manifests, templates, styles, and tests.
- `packages/testing`: future fixture, browser, accessibility, and visual testing helpers.
- `reference-inputs`: raw and normalized upstream/reference inputs.
- `reference-sources`: clean extracted source authority used by manifests.
- `tools`: deterministic generation and validation scripts.

## Operating Rules

- Prefer existing workspace patterns over new abstractions.
- Keep generated output out of source control: `dist/`, `.playwright-mcp/`, `.DS_Store`,
  and `*.tsbuildinfo` are disposable artifacts.
- Do not edit generated inventories by hand unless the generator is broken:
  - `packages/components/src/component-status.json`
  - `packages/design-system/src/tokens/derived/modena.derived.tokens.json`
- Keep schema and validator changes together:
  - `schemas/*.schema.json`
  - `tools/validators/*.ts`
- Component profiles are generated from component status and sources. Use
  `tools/codex/component-profiles/overrides/` only for real exceptions.
- Do not commit, publish packages, push branches, or run destructive cleanup unless explicitly asked.
- If the project is not inside a Git repository, state that Codex review/worktree features are limited.

## Required Verification

For structural/tooling changes, run:

```bash
pnpm typecheck
pnpm build
npm run compute:tokens
npm run generate:component-manifests
npm run validate:components
npm run extract:clean-sources -- --dry-run
```

For the viewer, also run:

```bash
npm run viewer:dev
```

Then verify the served page in a browser and check console errors.

`pnpm test` currently executes package placeholder scripts. Treat it as a smoke
check only until real tests are implemented.

## Component Work

Before changing a component:

1. Read its `*.manifest.json` and `*.sources.json`.
2. Read the relevant source files in `reference-sources/`.
3. Update implementation, template, styles, and tests together when behavior changes.
4. Regenerate component status with `npm run generate:component-manifests`.
5. Do not change a manifest status to certified without a certification report and evidence.

## Codex Setup

Use the repo-local `$jfx-modena-web-components` skill for project-specific work.
Use `llms.txt` for the compact Codex documentation map and `llms-full.txt` only
when exact Codex configuration behavior is needed.

For repeatable Codex audits, use programmatic prompt tooling instead of ad hoc
manual prompts:

```bash
npm run --silent codex:component-profile -- jfx-button
npm run --silent codex:component-context -- jfx-button
npm run --silent codex:audit-component -- jfx-button --print-prompt
```
