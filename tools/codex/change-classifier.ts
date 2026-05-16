#!/usr/bin/env node
import { fileURLToPath } from "node:url";
import { getGitSnapshot, runGit } from "./project-automation-utils.ts";

export type ChangeArea =
  | "components"
  | "viewer"
  | "design-system"
  | "runtime"
  | "testing"
  | "source-authority"
  | "codex-pipeline"
  | "guidance"
  | "dependencies"
  | "generated-inventory"
  | "generated-artifacts"
  | "unknown";

export type DirtyFile = {
  status: string;
  path: string;
  area: ChangeArea;
};

export type ChangeClassification = {
  schemaVersion: 1;
  generatedBy: string;
  git: {
    branch: string | null;
    head: string | null;
    dirty: boolean;
  };
  areas: ChangeArea[];
  dirtyFiles: DirtyFile[];
  requiredCommands: string[];
  recommendedCommands: string[];
  risks: string[];
};

const commandByArea: Record<ChangeArea, string[]> = {
  components: [
    "pnpm --filter @autoprint/jfx-modena-components test",
    "pnpm typecheck",
    "pnpm build",
    "npm run generate:component-manifests",
    "npm run validate:components",
  ],
  viewer: [
    "pnpm build",
  ],
  "design-system": [
    "npm run compute:tokens",
    "pnpm --filter @autoprint/jfx-modena-design-system typecheck",
    "pnpm --filter @autoprint/jfx-modena-design-system build",
  ],
  runtime: [
    "pnpm --filter @autoprint/jfx-modena-runtime typecheck",
    "pnpm --filter @autoprint/jfx-modena-runtime build",
  ],
  testing: [
    "pnpm --filter @autoprint/jfx-modena-testing typecheck",
    "pnpm --filter @autoprint/jfx-modena-testing build",
  ],
  "source-authority": [
    "npm run extract:clean-sources",
    "npm run generate:component-manifests",
    "npm run validate:components",
    "npm run extract:clean-sources -- --dry-run",
  ],
  "codex-pipeline": [
    "npm run typecheck:tools",
    "npm run codex:validate-output-schemas",
    "npm run --silent codex:audit-component -- jfx-button --print-prompt",
  ],
  guidance: [
    "npm run codex:preflight",
    "npm run codex:project-status",
  ],
  dependencies: [
    "npm run verify",
  ],
  "generated-inventory": [
    "npm run generate:component-manifests",
    "npm run compute:tokens",
    "npm run validate:components",
  ],
  "generated-artifacts": [],
  unknown: [
    "npm run verify",
  ],
};

export function buildChangeClassification(): ChangeClassification {
  const git = getGitSnapshot();
  const dirtyFiles = parseGitStatus(git.statusShort).map((file) => ({
    ...file,
    area: classifyPath(file.path),
  }));
  const areas = [...new Set(dirtyFiles.map((file) => file.area))].sort();
  const requiredCommands = uniqueCommands([
    "npm run codex:preflight",
    "npm run codex:project-status",
    "git diff --check",
  ]);
  const recommendedCommands = uniqueCommands(areas.flatMap((area) => commandByArea[area] ?? commandByArea.unknown));
  const risks = buildRisks(dirtyFiles, areas);

  return {
    schemaVersion: 1,
    generatedBy: "tools/codex/change-classifier.ts",
    git: {
      branch: git.branch,
      head: git.head,
      dirty: git.dirty,
    },
    areas,
    dirtyFiles,
    requiredCommands,
    recommendedCommands,
    risks,
  };
}

export function parseGitStatus(statusShort: string): Array<{ status: string; path: string }> {
  return statusShort
    .split("\n")
    .map((line) => line.trimEnd())
    .filter(Boolean)
    .map((line) => {
      const status = line.slice(0, 2);
      const rawPath = line.slice(3);
      const path = rawPath.includes(" -> ") ? rawPath.split(" -> ").at(-1) ?? rawPath : rawPath;
      return { status, path };
    });
}

export function classifyPath(projectPath: string): ChangeArea {
  if (
    projectPath.includes("/dist/")
    || projectPath.includes("/test-results/")
    || projectPath.startsWith("playwright-report/")
    || projectPath.startsWith(".codex-runs/")
  ) {
    return "generated-artifacts";
  }

  if (
    projectPath === "packages/components/src/component-status.json"
    || projectPath === "packages/design-system/src/tokens/derived/modena.derived.tokens.json"
    || projectPath.startsWith("reference-sources/manifests/")
    || projectPath === "project-status.generated.json"
  ) {
    return "generated-inventory";
  }

  if (projectPath === "package.json" || projectPath === "pnpm-lock.yaml" || projectPath.endsWith("/package.json")) {
    return "dependencies";
  }

  if (projectPath === ".gitignore" || projectPath === "pnpm-workspace.yaml" || projectPath.startsWith(".github/")) {
    return "guidance";
  }

  if (
    projectPath === "AGENTS.md"
    || projectPath.endsWith("/AGENTS.md")
    || projectPath.endsWith("/AGENTS.override.md")
    || projectPath.startsWith(".agents/skills/")
  ) {
    return "guidance";
  }

  if (
    projectPath.startsWith("tools/codex/")
    || projectPath.startsWith(".codex/")
    || projectPath.startsWith("schemas/codex-")
  ) {
    return "codex-pipeline";
  }

  if (
    projectPath.startsWith("reference-sources/")
    || projectPath.startsWith("reference-inputs/")
    || projectPath === "tools/clean-source-allowlist.json"
    || projectPath === "tools/extract-clean-sources.ts"
    || projectPath === "tools/ingest-openjfx-normalized-sources.ts"
    || projectPath === "tools/sync-component-sources.ts"
  ) {
    return "source-authority";
  }

  if (projectPath.startsWith("packages/components/")) {
    return "components";
  }

  if (projectPath.startsWith("apps/viewer/")) {
    return "viewer";
  }

  if (projectPath.startsWith("packages/design-system/")) {
    return "design-system";
  }

  if (projectPath.startsWith("packages/runtime/")) {
    return "runtime";
  }

  if (projectPath.startsWith("packages/testing/")) {
    return "testing";
  }

  return "unknown";
}

function buildRisks(dirtyFiles: DirtyFile[], areas: ChangeArea[]): string[] {
  const risks: string[] = [];

  if (dirtyFiles.some((file) => file.area === "generated-artifacts")) {
    risks.push("Disposable generated artifacts appear in Git status; keep them ignored and untracked.");
  }

  if (dirtyFiles.some((file) => file.path === "packages/components/src/component-status.json")) {
    risks.push("component-status.json changed; ensure it was regenerated, not hand-edited.");
  }

  if (dirtyFiles.some((file) => file.path === "packages/design-system/src/tokens/derived/modena.derived.tokens.json")) {
    risks.push("Derived token file changed; ensure it was produced by compute:tokens.");
  }

  if (areas.includes("components") && !areas.includes("generated-inventory")) {
    risks.push("Component files changed without an obvious generated inventory change; run generate:component-manifests.");
  }

  if (areas.includes("dependencies")) {
    risks.push("Dependency or package metadata changed; run full verification and inspect lockfile changes.");
  }

  if (areas.includes("viewer")) {
    risks.push("Viewer changed; browser verification is still required for runtime confidence.");
  }

  return risks;
}

function uniqueCommands(commands: string[]): string[] {
  return [...new Set(commands)].filter(Boolean);
}

function printHuman(classification: ChangeClassification): void {
  console.log(`Git dirty: ${classification.git.dirty ? "yes" : "no"}`);
  console.log(`Areas: ${classification.areas.length > 0 ? classification.areas.join(", ") : "none"}`);
  console.log("");
  console.log("Dirty files:");
  if (classification.dirtyFiles.length === 0) {
    console.log("- none");
  } else {
    for (const file of classification.dirtyFiles) {
      console.log(`- ${file.status} ${file.path} [${file.area}]`);
    }
  }
  console.log("");
  console.log("Required commands:");
  for (const command of classification.requiredCommands) {
    console.log(`- ${command}`);
  }
  console.log("");
  console.log("Recommended commands:");
  for (const command of classification.recommendedCommands) {
    console.log(`- ${command}`);
  }
  if (classification.risks.length > 0) {
    console.log("");
    console.log("Risks:");
    for (const risk of classification.risks) {
      console.log(`- ${risk}`);
    }
  }
}

function isMainModule(): boolean {
  return process.argv[1] === fileURLToPath(import.meta.url);
}

function run(): void {
  const jsonMode = process.argv.includes("--json");
  const classification = buildChangeClassification();

  if (jsonMode) {
    console.log(JSON.stringify(classification, null, 2));
  } else {
    printHuman(classification);
  }
}

if (isMainModule()) {
  run();
}
