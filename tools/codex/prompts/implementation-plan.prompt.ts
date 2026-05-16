#!/usr/bin/env node
import { stdin } from "node:process";

function parseContext(contextJson: string): {
  component: string;
  sourceAuthority: string[];
  allowedFiles: string[];
} {
  const context = JSON.parse(contextJson) as {
    component?: unknown;
    profile?: { sourceAuthority?: unknown; allowedFiles?: unknown };
  };

  return {
    component: typeof context.component === "string" ? context.component : "unknown",
    sourceAuthority: Array.isArray(context.profile?.sourceAuthority)
      ? context.profile.sourceAuthority.filter((item): item is string => typeof item === "string")
      : [],
    allowedFiles: Array.isArray(context.profile?.allowedFiles)
      ? context.profile.allowedFiles.filter((item): item is string => typeof item === "string")
      : [],
  };
}

export function buildImplementationPlanPrompt(contextJson: string): string {
  const { component, sourceAuthority, allowedFiles } = parseContext(contextJson);

  return `You are planning source-backed implementation work for one JavaFX Modena Web Component.

Component tag: ${component}
Source authority:
${sourceAuthority.map((source) => `- ${source}`).join("\n") || "- None declared"}

Allowed files for any future implementation:
${allowedFiles.map((file) => `- ${file}`).join("\n") || "- None declared"}

Constraints:
- Read-only planning stage. Do not edit, create, delete, format, regenerate, or commit files.
- Use only the provided component context and source excerpts.
- Do not implement behavior in this response.
- Do not claim certification or promote component status.
- Any future write recommendations must stay within profile.allowedFiles.
- If evidence is missing, return planStatus "blocked_missing_evidence" and list blockers.

Expected output:
- Return JSON only.
- The JSON must match schemas/codex-implementation-plan.schema.json.
- Include source files to read in full, planned file changes, runtime helpers to reuse, verification commands, certification blockers, residual risk, and confidence.

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

  console.log(buildImplementationPlanPrompt(contextJson));
}

if (process.argv[1]?.endsWith("implementation-plan.prompt.ts")) {
  await run();
}
