---
name: jfx-source-authority
description: "Use for OpenJFX/Modena source authority work: seeding, ingesting normalized sources, syncing component sources, and validating source maps."
---

# JFX Source Authority

Use this skill when a component lacks source authority or when clean OpenJFX
sources, normalized inputs, allowlists, or source manifests need work.

## Authority Order

1. `reference-sources/openjfx/`
2. `reference-sources/scenebuilder/`
3. `reference-sources/docs/`
4. `reference-inputs/prototypes/` only as non-authoritative context

Never use `.codex-runs/` as authority. Codex outputs can suggest gaps, but the
repo must contain deterministic source inputs and clean extracted sources.

## Workflow

1. Inspect the component `*.sources.json` and `component-status.json`.
2. Run source-authority seeding only when a proposal is needed:

   ```bash
   npm run --silent codex:source-authority-seeding -- <component> --output .codex-runs/<component>-source-authority-seeding.json
   ```

3. If upstream files are missing, add deterministic normalized ingestion before
   adding allowlist entries.
4. Update `tools/clean-source-allowlist.json`, then run extraction.
5. Sync component sources with the deterministic tool:

   ```bash
   npm run sync:component-sources -- --component <component> --write
   ```

6. Regenerate manifests and validate.

## Verification

```bash
npm run extract:clean-sources
npm run sync:component-sources -- --component <component> --dry-run
npm run generate:component-manifests
npm run validate:components
npm run extract:clean-sources -- --dry-run
npm run typecheck:tools
git diff --check
```

Report source counts before and after, remaining missing sources, and any
non-authoritative inputs.
