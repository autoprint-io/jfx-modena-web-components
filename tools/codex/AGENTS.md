# Codex Tooling Guidance

This directory owns programmatic Codex context collection, prompts, schemas,
stage runners, and run logging.

## Prompt Pipeline Rules

- Prefer schema-first structured outputs over ad hoc prompts.
- Keep read-only stages read-only.
- Write run logs to `.codex-runs/`; never treat `.codex-runs/` as source authority.
- Preserve `--print-prompt` as a no-side-effect path.
- Preserve `--output` behavior and only write output files after successful runs.
- Keep prompt builders, output schemas, and runners aligned when changing a stage.
- Avoid adding broad implementation runners until source, plan, and verification gates are reliable.

## Verification

For changes here:

```bash
npm run typecheck:tools
npm run codex:validate-output-schemas
npm run --silent codex:component-context -- jfx-button
npm run --silent codex:audit-component -- jfx-button --print-prompt
git diff --check
```
