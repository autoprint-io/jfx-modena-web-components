import { buildComponentAuditPrompt } from "./prompts/audit-component.prompt.ts";
import { buildCertificationProfilePrompt } from "./prompts/certification-profile.prompt.ts";
import { buildImplementationPlanPrompt } from "./prompts/implementation-plan.prompt.ts";
import { buildSourceAuthoritySeedingPrompt } from "./prompts/source-authority-seeding.prompt.ts";
import { buildSourceTraceabilityPrompt } from "./prompts/source-traceability.prompt.ts";

export type CodexStageId =
  | "source-authority-seeding"
  | "source-traceability"
  | "certification-profile"
  | "component-plan"
  | "audit-component";

export type CodexStage = {
  id: CodexStageId;
  description: string;
  schemaPath: string;
  defaultFullSources: boolean;
  readOnly: boolean;
  npmScript: string;
  buildPrompt: (contextJson: string) => string;
};

export const codexStages: CodexStage[] = [
  {
    id: "source-authority-seeding",
    description: "Propose missing source authority before implementation work.",
    schemaPath: "schemas/codex-source-authority-seeding.schema.json",
    defaultFullSources: false,
    readOnly: true,
    npmScript: "codex:source-authority-seeding",
    buildPrompt: buildSourceAuthoritySeedingPrompt,
  },
  {
    id: "source-traceability",
    description: "Review declared source authority against component context.",
    schemaPath: "schemas/codex-source-traceability.schema.json",
    defaultFullSources: true,
    readOnly: true,
    npmScript: "codex:source-traceability",
    buildPrompt: buildSourceTraceabilityPrompt,
  },
  {
    id: "certification-profile",
    description: "Define required certification evidence gates.",
    schemaPath: "schemas/codex-certification-profile.schema.json",
    defaultFullSources: false,
    readOnly: true,
    npmScript: "codex:certification-profile",
    buildPrompt: buildCertificationProfilePrompt,
  },
  {
    id: "component-plan",
    description: "Plan source-backed implementation work without editing.",
    schemaPath: "schemas/codex-implementation-plan.schema.json",
    defaultFullSources: false,
    readOnly: true,
    npmScript: "codex:component-plan",
    buildPrompt: buildImplementationPlanPrompt,
  },
  {
    id: "audit-component",
    description: "Audit implementation, context, and source gaps.",
    schemaPath: "schemas/codex-component-audit.schema.json",
    defaultFullSources: false,
    readOnly: true,
    npmScript: "codex:audit-component",
    buildPrompt: buildComponentAuditPrompt,
  },
];

export const runnerOutputSchemaPaths = codexStages.map((stage) => stage.schemaPath);

export function getCodexStage(stageId: string): CodexStage {
  const stage = codexStages.find((candidate) => candidate.id === stageId);
  if (!stage) {
    throw new Error(`Unknown Codex stage: ${stageId}`);
  }

  return stage;
}
