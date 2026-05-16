---
name: jfx-viewer-verification
description: "Use for viewer changes, browser runtime checks, visual smoke verification, screenshots, and console-error review for jfx-* components."
---

# JFX Viewer Verification

Use this skill when work touches `apps/viewer`, visual examples, or browser
runtime behavior.

## Workflow

1. Confirm the target component is exported and defined.
2. Start the viewer:

   ```bash
   npm run viewer:dev
   ```

3. Open the served URL in a browser.
4. Check that the target component renders in the relevant states.
5. Check console errors.
6. Capture screenshots only when visual evidence is requested or useful.

## Rules

- Viewer evidence supports certification but does not complete it alone.
- Do not hide missing states with marketing copy or decorative UI.
- Keep the viewer compact and technical; avoid generic SaaS landing-page patterns.

## Verification

Also run:

```bash
pnpm build
git diff --check
```

Report browser URL, observed states, console status, and any rendering gaps.
