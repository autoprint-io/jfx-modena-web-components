#!/usr/bin/env node
import { stdin } from "node:process";

function parseContext(contextJson: string): { component: string; sourceAuthority: string[] } {
  const context = JSON.parse(contextJson) as {
    component?: unknown;
    profile?: { sourceAuthority?: unknown };
  };

  return {
    component: typeof context.component === "string" ? context.component : "unknown",
    sourceAuthority: Array.isArray(context.profile?.sourceAuthority)
      ? context.profile.sourceAuthority.filter((item): item is string => typeof item === "string")
      : [],
  };
}

export function buildCertificationProfilePrompt(contextJson: string): string {
  const { component, sourceAuthority } = parseContext(contextJson);

  return `You are defining a read-only certification profile for one JavaFX Modena Web Component.

Component tag: ${component}
Source authority:
${sourceAuthority.map((source) => `- ${source}`).join("\n") || "- None declared"}

Constraints:
- Read-only stage. Do not edit, create, delete, format, regenerate, or commit files.
- Use only the provided component context and source excerpts.
- Do not claim certification.
- Do not promote component status.
- Define the evidence gates needed before certification-driven implementation can proceed.
- If source, visual, behavior, keyboard/focus, accessibility, or browser/runtime evidence is missing, report it as a blocker.

Expected output:
- Return JSON only.
- The JSON must match schemas/codex-certification-profile.schema.json.
- Include the current component status, required gates, allowed files, source authority, known blockers, and confidence.

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

  console.log(buildCertificationProfilePrompt(contextJson));
}

if (process.argv[1]?.endsWith("certification-profile.prompt.ts")) {
  await run();
}
