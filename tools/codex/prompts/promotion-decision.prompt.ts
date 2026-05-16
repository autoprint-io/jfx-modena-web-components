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

export function buildPromotionDecisionPrompt(contextJson: string): string {
  const { component, sourceAuthority } = parseContext(contextJson);

  return `You are making a status-promotion decision for one JavaFX Modena Web Component.

Component tag: ${component}
Source authority:
${sourceAuthority.map((source) => `- ${source}`).join("\n") || "- None declared"}

Constraints:
- Decision-only stage. Do not edit files.
- Use only the provided component context, source excerpts, and supplied verification evidence.
- Never mark certified unless visual, behavior, keyboard/focus, accessibility, browser/runtime, and source-traceability gates all have explicit evidence.
- Do not infer certification from scaffolds, snapshots, generated manifests, or visual similarity alone.
- If any gate is missing, decision must be "do_not_promote" or a non-certified target status.

Expected output:
- Return JSON only.
- The JSON must match schemas/codex-promotion-decision.schema.json.
- Include gate evidence, missing gates, statusChangeAllowed, rationale, residual risk, and confidence.

Component context and evidence input:

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

  console.log(buildPromotionDecisionPrompt(contextJson));
}

if (process.argv[1]?.endsWith("promotion-decision.prompt.ts")) {
  await run();
}
