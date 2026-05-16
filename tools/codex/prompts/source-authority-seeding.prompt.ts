#!/usr/bin/env node
import { stdin } from "node:process";

function parseContext(contextJson: string): {
  component: string;
  currentSourceCount: number;
  javafxClass: string | null;
  javafxStyleClass: string | null;
  category: string | null;
  sourceAuthority: string[];
} {
  const context = JSON.parse(contextJson) as {
    component?: unknown;
    manifest?: { javafxClass?: unknown; javafxStyleClass?: unknown };
    statusRecord?: { category?: unknown; sourceCount?: unknown };
    profile?: { sourceAuthority?: unknown };
  };

  return {
    component: typeof context.component === "string" ? context.component : "unknown",
    currentSourceCount:
      typeof context.statusRecord?.sourceCount === "number" ? context.statusRecord.sourceCount : 0,
    javafxClass: typeof context.manifest?.javafxClass === "string" ? context.manifest.javafxClass : null,
    javafxStyleClass:
      typeof context.manifest?.javafxStyleClass === "string" ? context.manifest.javafxStyleClass : null,
    category: typeof context.statusRecord?.category === "string" ? context.statusRecord.category : null,
    sourceAuthority: Array.isArray(context.profile?.sourceAuthority)
      ? context.profile.sourceAuthority.filter((item): item is string => typeof item === "string")
      : [],
  };
}

export function buildSourceAuthoritySeedingPrompt(contextJson: string): string {
  const { component, currentSourceCount, javafxClass, javafxStyleClass, category, sourceAuthority } =
    parseContext(contextJson);

  return `You are proposing source authority for one JavaFX Modena Web Component.

Component tag: ${component}
Category: ${category ?? "unknown"}
JavaFX class: ${javafxClass ?? "unknown"}
JavaFX style class: ${javafxStyleClass ?? "unknown"}
Current source count: ${currentSourceCount}
Current source authority:
${sourceAuthority.map((source) => `- ${source}`).join("\n") || "- None declared"}

Purpose:
- Propose the OpenJFX, Modena CSS, Scene Builder, and JavaFX documentation sources needed before source-traceable implementation work can proceed.
- This is a read-only seeding stage. Do not edit, create, delete, format, regenerate, or commit files.
- Use reference-sources/ naming conventions when suggesting already-extracted clean sources.
- Use plausible upstream source paths only when the clean source is missing and explain the uncertainty.
- Treat reference-sources/ as authoritative and reference-inputs/prototypes/ as non-authoritative only.
- Do not claim JavaFX/Modena certification.
- If evidence is missing, report blockers instead of inventing certainty.

Expected output:
- Return JSON only.
- The JSON must match schemas/codex-source-authority-seeding.schema.json.
- Include suggestedSources, sourceKinds, rationale, missingSourceRisks, blockers, and confidence.

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

  console.log(buildSourceAuthoritySeedingPrompt(contextJson));
}

if (process.argv[1]?.endsWith("source-authority-seeding.prompt.ts")) {
  await run();
}
