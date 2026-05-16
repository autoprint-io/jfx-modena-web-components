#!/usr/bin/env node
import { stdin } from "node:process";

export function buildComponentImplementationPrompt(contextJson: string): string {
  return `You are planning a source-backed implementation for one JavaFX Modena Web Component.

Use only the provided component context and source excerpts. Do not write code in this response.
Return a concise implementation plan that preserves jfx-* naming and does not claim certification.

Plan requirements:
- Respect profile.allowedFiles. Do not propose unrelated file edits.
- Use profile.sourceAuthority as the only approved source authority list.
- Treat profile.riskFlags as implementation and verification risks.
- List the source files that must be read in full before implementation.
- Identify runtime helpers that should be reused.
- Specify component, template, styles, unit test, and accessibility test changes.
- Specify verification commands.
- List certification blockers that remain after implementation.

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

  console.log(buildComponentImplementationPrompt(contextJson));
}

if (process.argv[1]?.endsWith("implement-component.prompt.ts")) {
  await run();
}
