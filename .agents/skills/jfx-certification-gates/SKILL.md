---
name: jfx-certification-gates
description: "Use when auditing whether a jfx-* component can advance certification status. Enforces source, visual, behavior, keyboard/focus, accessibility, and browser/runtime gates."
---

# JFX Certification Gates

Use this skill for audit and readiness decisions. It is not an implementation
workflow.

## Gates

A component is not certified unless every gate has explicit evidence:

- Source traceability
- Visual parity evidence
- Behavior parity evidence
- Keyboard/focus evidence
- Accessibility evidence
- Browser/runtime evidence

Generated manifests, scaffolds, visual similarity, and Codex summaries are not
certification evidence by themselves.

## Workflow

1. Read component manifest, sources, tests, implementation, and viewer coverage.
2. Run read-only Codex stages when useful:

   ```bash
   npm run --silent codex:source-traceability -- <component> --full-sources --output .codex-runs/<component>-source-traceability.json
   npm run --silent codex:certification-profile -- <component> --full-sources --output .codex-runs/<component>-certification-profile.json
   npm run --silent codex:audit-component -- <component> --full-sources --output .codex-runs/<component>-audit.json
   ```

3. Verify output files exist and parse before citing them.
4. Lead with blockers. Only recommend a status change when evidence exists.

## Output

Report:

- Current status and certification status
- Passed gates with evidence paths
- Failed or missing gates
- Commands run and exit codes
- Confidence level
