#!/usr/bin/env node
import { stdin } from "node:process";

export function buildComponentAuditPrompt(contextJson: string): string {
  return `You are auditing one JavaFX Modena Web Component.

Use only the provided component context and source excerpts. Do not claim certification.
Return only JSON matching schemas/codex-component-audit.schema.json.

Audit requirements:
- Compare implementation, template, styles, manifest, and sources.
- Respect profile.allowedFiles and profile.sourceAuthority.
- Treat profile.riskFlags as required areas to inspect.
- Identify missing source traceability.
- Identify behavior, keyboard/focus, accessibility, visual, and implementation gaps.
- Prefer precise statuses over optimistic language.
- If evidence is missing, report it as a gap.

Component context:

\`\`\`json
${contextJson}
\`\`\`
`;
}

async function readStdin(): Promise<string> {
  const chunks: Buffer[] = [];
  for await (const chunk of stdin) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }
  return Buffer.concat(chunks).toString("utf8");
}

async function run(): Promise<void> {
  const contextJson = await readStdin();
  if (!contextJson.trim()) {
    console.error("Expected component context JSON on stdin.");
    process.exit(1);
  }

  console.log(buildComponentAuditPrompt(contextJson));
}

if (process.argv[1]?.endsWith("audit-component.prompt.ts")) {
  await run();
}
