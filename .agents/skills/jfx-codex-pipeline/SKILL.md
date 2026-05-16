---
name: jfx-codex-pipeline
description: "Use for programmatic Codex prompt tooling: component context, schemas, read-only stages, run logs, batch stages, and output validation."
---

# JFX Codex Pipeline

Use this skill when changing `tools/codex`, `schemas/codex-*.schema.json`, or
batch/stage automation.

## Rules

- Prefer schema-first structured outputs.
- Keep read-only stages read-only.
- Keep `--print-prompt` side-effect free.
- Write real run logs under `.codex-runs/`; keep that directory ignored.
- Do not write `--output` files for failed Codex runs.
- Validate schemas against Codex response-format limits.
- Use `codex:preflight`, `codex:project-status`, and `codex:handoff` for
  continuity instead of hand-written session-start prompts.
- Use `codex:change-classifier` and `codex:closeout` to close tasks with an
  explicit area map, verification plan, generated project status, and handoff.
- Treat `.codex/hooks.json` hooks as advisory. They may refresh closeout state,
  but manual verification remains authoritative.
- Use `codex:self-test` after changing this automation layer.

## Workflow

1. Read `tools/codex/AGENTS.md`.
2. Update prompt builder, schema, stage registry, and runner together.
3. Preserve existing CLI flags unless there is a verified reason to change them.
4. For batch changes, verify dry-run before any execute mode.
5. Regenerate `project-status.generated.json` when changing component inventory,
   project Codex guidance, scripts, stages, skills, or custom agents.
6. For hooks, route through small wrappers under `tools/codex/hooks/`; do not
   put heavy logic directly in `.codex/hooks.json`.

## Verification

```bash
npm run typecheck:tools
npm run codex:preflight
npm run codex:change-classifier
npm run codex:project-status
npm run codex:closeout -- --component jfx-button
npm run --silent codex:handoff -- --component jfx-button
npm run codex:self-test
npm run codex:validate-output-schemas
npm run --silent codex:source-traceability -- jfx-button --print-prompt
npm run --silent codex:certification-profile -- jfx-button --print-prompt
npm run --silent codex:component-plan -- jfx-button --print-prompt
npm run --silent codex:audit-component -- jfx-button --print-prompt
git diff --check
```
