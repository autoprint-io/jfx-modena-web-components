# JFX Modena Web Components

Frameworkless Web Components port of JavaFX Modena controls.

This repository is source-traceable scaffolding plus the first partial Web Component implementation. It is not yet a certified component library.

## Current Status

- `jfx-button` is implemented as an initial partial component.
- The remaining component folders are scaffolds with manifests, source maps, style files, templates, and test placeholders.
- No component is certified as JavaFX/Modena-complete yet.
- `reference-sources/` is generated from curated OpenJFX, Scene Builder, and JavaFX CSS reference inputs.

## Workspace Layout

```txt
apps/viewer              Visual viewer and future certification dashboard.
packages/runtime         Shared custom-element/runtime primitives.
packages/design-system   Modena tokens, CSS variables, foundations, and themes.
packages/components      jfx-* Web Components and component metadata.
packages/testing         Future fixture, accessibility, browser, and visual test helpers.
reference-inputs         Raw and normalized source inputs.
reference-sources        Clean extracted source authority used by manifests.
tools                    Deterministic generation and validation scripts.
```

## Source Authority

Use this order when resolving implementation conflicts:

1. Pinned OpenJFX source and Modena CSS in `reference-sources/openjfx/`.
2. Scene Builder fixtures in `reference-sources/scenebuilder/`.
3. JavaFX CSS reference in `reference-sources/docs/`.
4. Prototype material under `reference-inputs/prototypes/` as non-authoritative reference only.

Do not mark a component as certified from snapshots, legacy prototype behavior, or scaffold presence alone.

## Commands

```bash
pnpm install
pnpm typecheck
pnpm build
npm run extract:clean-sources -- --dry-run
npm run compute:tokens
npm run generate:component-manifests
npm run validate:components
npm run verify
npm run viewer:dev
```

`pnpm build` emits `dist/` folders. They are generated artifacts and are ignored by Git.

## Generated Project State

Run this after adding or changing component manifests:

```bash
npm run generate:component-manifests
```

The generated inventory lives at:

```txt
packages/components/src/component-status.json
```

It distinguishes implemented partial components from scaffold-only components.

## Token Inventory

Run this after changing token files or emitted CSS variables:

```bash
npm run compute:tokens
```

The generated inventory lives at:

```txt
packages/design-system/src/tokens/derived/modena.derived.tokens.json
```

## Verification Policy

Before claiming a structural change is ready, run:

```bash
npm run verify
```

Before claiming a visual or behavioral component is ready, add browser, accessibility, interaction, and source-traceability evidence. Certification requires explicit visual, behavior, accessibility, and source gates.

## Codex Configuration

Codex project guidance lives in:

```txt
AGENTS.md
.codex/config.toml
.agents/skills/jfx-modena-web-components/SKILL.md
```

Start Codex from the repository root so the local instructions, config, and repo
skill are discoverable. If the project is not initialized as a Git repository,
Codex review and worktree features are limited.

## Component Quality Control

Schemas and deterministic validators live in:

```txt
schemas/
tools/validators/
tools/codex/component-profiles/overrides/
```

Run:

```bash
npm run validate:components
```

Programmatic Codex prompt tooling lives in:

```txt
tools/codex/
```

Useful entry points:

```bash
npm run --silent codex:component-profile -- jfx-button
npm run --silent codex:component-context -- jfx-button
npm run --silent codex:audit-component -- jfx-button --print-prompt
```
