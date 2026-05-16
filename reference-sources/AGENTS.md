# Reference Sources Guidance

This directory contains clean extracted source authority.

## Authority Rules

- Do not edit clean source files by hand unless the extractor is broken and the
  fix is explicitly scoped.
- Prefer changing `tools/clean-source-allowlist.json` and rerunning extraction.
- Preserve the distinction between normalized inputs and clean extracted sources.
- OpenJFX and Modena sources are authority for implementation mapping, but not
  evidence of web runtime parity by themselves.
- `.codex-runs/` outputs can guide investigation but are not source authority.

## Verification

For source-authority changes:

```bash
npm run extract:clean-sources
npm run extract:clean-sources -- --dry-run
npm run validate:components
npm run typecheck:tools
git diff --check
```
