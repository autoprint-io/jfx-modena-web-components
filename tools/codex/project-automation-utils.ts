import fs from "node:fs";
import path from "node:path";
import { execFileSync, spawnSync } from "node:child_process";
import { isRecord, projectRoot, readJson, resolveProjectPath } from "../validators/validation-utils.ts";
import { codexStages } from "./codex-stages.ts";

export type ComponentStatusRecord = {
  tagName: string;
  category: string;
  directory: string;
  componentStatus: string;
  certificationStatus: string;
  sourceCount: number;
  files: Record<string, string | null>;
};

export type ProjectStatus = {
  schemaVersion: 1;
  generatedBy: string;
  sourceFiles: string[];
  project: {
    name: string;
    packageManager: string | null;
    private: boolean | null;
    scripts: Record<string, string>;
  };
  codex: {
    configPath: string;
    agentCount: number;
    agents: string[];
    hookFiles: string[];
    skillCount: number;
    skills: string[];
    instructionFiles: string[];
    stages: Array<{
      id: string;
      readOnly: boolean;
      defaultFullSources: boolean;
      schemaPath: string;
      npmScript: string;
    }>;
  };
  components: {
    total: number;
    byStatus: Record<string, number>;
    byCategory: Record<string, number>;
    implementedPartial: Array<{
      tagName: string;
      category: string;
      certificationStatus: string;
      sourceCount: number;
    }>;
    sourceBackedScaffolds: Array<{
      tagName: string;
      category: string;
      sourceCount: number;
      certificationStatus: string;
    }>;
    suggestedFirstPassCandidates: Array<{
      tagName: string;
      category: string;
      sourceCount: number;
      certificationStatus: string;
    }>;
  };
  referenceSources: {
    sourceCount: number;
    missingCount: number;
    byKind: Record<string, number>;
  };
  verification: {
    defaultCommand: string;
    structuralCommands: string[];
    areaCommands: Record<string, string[]>;
  };
  guardrails: string[];
};

export type GitSnapshot = {
  branch: string | null;
  head: string | null;
  statusShort: string;
  dirty: boolean;
};

export const projectStatusPath = "project-status.generated.json";

export function readPackageJson(): Record<string, unknown> {
  const packageJson = readJson(resolveProjectPath("package.json"));
  if (!isRecord(packageJson)) {
    throw new Error("Invalid package.json.");
  }

  return packageJson;
}

export function readComponentStatusRecords(): ComponentStatusRecord[] {
  const status = readJson(resolveProjectPath("packages/components/src/component-status.json"));
  if (!isRecord(status) || !Array.isArray(status.components)) {
    throw new Error("Invalid packages/components/src/component-status.json.");
  }

  return status.components.map((record) => {
    if (!isRecord(record) || typeof record.tagName !== "string") {
      throw new Error("Invalid component status record.");
    }

    return {
      tagName: record.tagName,
      category: String(record.category),
      directory: String(record.directory),
      componentStatus: String(record.componentStatus),
      certificationStatus: String(record.certificationStatus),
      sourceCount: Number(record.sourceCount ?? 0),
      files: isRecord(record.files) ? (record.files as Record<string, string | null>) : {},
    };
  });
}

export function getGitSnapshot(): GitSnapshot {
  const branch = runGit(["branch", "--show-current"]).stdout.trim() || null;
  const head = runGit(["rev-parse", "HEAD"]).stdout.trim() || null;
  const statusShort = runGit(["status", "--short"]).stdout.trimEnd();

  return {
    branch,
    head,
    statusShort,
    dirty: statusShort.trim().length > 0,
  };
}

export function runGit(args: string[]): { exitCode: number; stdout: string; stderr: string } {
  const result = spawnSync("git", args, {
    cwd: projectRoot,
    encoding: "utf8",
  });

  return {
    exitCode: result.status ?? 1,
    stdout: result.stdout ?? "",
    stderr: result.stderr ?? "",
  };
}

export function listInstructionFiles(): string[] {
  return walkProjectFiles((filePath) => {
    const name = path.basename(filePath);
    return name === "AGENTS.md" || name === "AGENTS.override.md";
  });
}

export function listSkillFiles(): string[] {
  const skillsRoot = resolveProjectPath(".agents/skills");
  if (!fs.existsSync(skillsRoot)) {
    return [];
  }

  return walkFiles(skillsRoot)
    .filter((filePath) => path.basename(filePath) === "SKILL.md")
    .map(toProjectPath)
    .sort();
}

export function listAgentFiles(): string[] {
  const agentsRoot = resolveProjectPath(".codex/agents");
  if (!fs.existsSync(agentsRoot)) {
    return [];
  }

  return fs
    .readdirSync(agentsRoot)
    .filter((entry) => entry.endsWith(".toml"))
    .map((entry) => `.codex/agents/${entry}`)
    .sort();
}

export function readSkillName(skillPath: string): string {
  const source = fs.readFileSync(resolveProjectPath(skillPath), "utf8");
  const match = source.match(/^name:\s*(.+)$/m);
  if (!match) {
    throw new Error(`${skillPath}: missing skill name.`);
  }

  return match[1].trim().replace(/^["']|["']$/g, "");
}

export function readAgentName(agentPath: string): string {
  const source = fs.readFileSync(resolveProjectPath(agentPath), "utf8");
  const match = source.match(/^name\s*=\s*["']([^"']+)["']/m);
  if (!match) {
    throw new Error(`${agentPath}: missing agent name.`);
  }

  return match[1];
}

export function buildProjectStatus(): ProjectStatus {
  const packageJson = readPackageJson();
  const scripts = isRecord(packageJson.scripts) ? Object.fromEntries(
    Object.entries(packageJson.scripts)
      .filter(([name]) => name.startsWith("codex:") || ["ci", "verify", "typecheck", "build", "test", "viewer:dev"].includes(name))
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([name, command]) => [name, String(command)]),
  ) : {};

  const status = readJson(resolveProjectPath("packages/components/src/component-status.json"));
  if (!isRecord(status) || !isRecord(status.counts)) {
    throw new Error("Invalid component status counts.");
  }

  const components = readComponentStatusRecords();
  const implementedPartial = components
    .filter((component) => component.componentStatus === "implemented_partial")
    .map((component) => pickComponentSummary(component));
  const sourceBackedScaffolds = components
    .filter((component) => component.componentStatus === "scaffold_only" && component.sourceCount > 0)
    .map((component) => pickComponentSummary(component));
  const suggestedFirstPassCandidates = [...sourceBackedScaffolds]
    .sort((a, b) => b.sourceCount - a.sourceCount || a.tagName.localeCompare(b.tagName))
    .slice(0, 12);

  const sourceIndex = readJson(resolveProjectPath("reference-sources/manifests/source-index.json"));
  const byKind: Record<string, number> = {};
  let sourceCount = 0;
  let missingCount = 0;
  if (isRecord(sourceIndex)) {
    sourceCount = Number(sourceIndex.sourceCount ?? 0);
    missingCount = Number(sourceIndex.missingCount ?? 0);
    const sources = Array.isArray(sourceIndex.sources) ? sourceIndex.sources : [];
    for (const source of sources) {
      if (isRecord(source)) {
        const kind = String(source.kind ?? "unknown");
        byKind[kind] = (byKind[kind] ?? 0) + 1;
      }
    }
  }

  const skillFiles = listSkillFiles();
  const agentFiles = listAgentFiles();

  return {
    schemaVersion: 1,
    generatedBy: "tools/codex/generate-project-status.ts",
    sourceFiles: [
      "package.json",
      "packages/components/src/component-status.json",
      "reference-sources/manifests/source-index.json",
      ".agents/skills/*/SKILL.md",
      ".codex/agents/*.toml",
      ".codex/hooks.json",
      "tools/codex/hooks/*.ts",
      "AGENTS.md",
    ],
    project: {
      name: String(packageJson.name ?? ""),
      packageManager: typeof packageJson.packageManager === "string" ? packageJson.packageManager : null,
      private: typeof packageJson.private === "boolean" ? packageJson.private : null,
      scripts,
    },
    codex: {
      configPath: ".codex/config.toml",
      agentCount: agentFiles.length,
      agents: agentFiles.map(readAgentName).sort(),
      hookFiles: listHookFiles(),
      skillCount: skillFiles.length,
      skills: skillFiles.map(readSkillName).sort(),
      instructionFiles: listInstructionFiles(),
      stages: codexStages.map((stage) => ({
        id: stage.id,
        readOnly: stage.readOnly,
        defaultFullSources: stage.defaultFullSources,
        schemaPath: stage.schemaPath,
        npmScript: stage.npmScript,
      })),
    },
    components: {
      total: components.length,
      byStatus: asNumberRecord(isRecord(status.counts.byStatus) ? status.counts.byStatus : {}),
      byCategory: asNumberRecord(isRecord(status.counts.byCategory) ? status.counts.byCategory : {}),
      implementedPartial,
      sourceBackedScaffolds,
      suggestedFirstPassCandidates,
    },
    referenceSources: {
      sourceCount,
      missingCount,
      byKind: Object.fromEntries(Object.entries(byKind).sort(([a], [b]) => a.localeCompare(b))),
    },
    verification: {
      defaultCommand: "npm run verify",
      structuralCommands: [
        "npm run codex:preflight",
        "npm run codex:project-status",
        "npm run typecheck:tools",
        "npm run codex:validate-output-schemas",
        "npm run validate:components",
        "git diff --check",
      ],
      areaCommands: {
        components: [
          "pnpm --filter @jfx-modena/components test",
          "pnpm typecheck",
          "pnpm build",
          "npm run generate:component-manifests",
          "npm run validate:components",
        ],
        "source-authority": [
          "npm run extract:clean-sources",
          "npm run generate:component-manifests",
          "npm run validate:components",
          "npm run extract:clean-sources -- --dry-run",
        ],
        viewer: [
          "npm run viewer:dev",
          "pnpm build",
        ],
        "codex-pipeline": [
          "npm run typecheck:tools",
          "npm run codex:validate-output-schemas",
          "npm run --silent codex:audit-component -- jfx-button --print-prompt",
        ],
      },
    },
    guardrails: [
      "Do not claim JavaFX/Modena certification without source, visual, behavior, keyboard/focus, accessibility, and browser/runtime evidence.",
      "Do not use .codex-runs as source authority.",
      "Do not hand-edit generated component-status or derived token files.",
      "Do not commit, push, publish, or run destructive cleanup unless Vinny explicitly asks.",
      "Keep first component passes minimal, source-backed, tested, and explicitly partial.",
    ],
  };
}

export function writeProjectStatus(projectStatus: ProjectStatus): void {
  fs.writeFileSync(resolveProjectPath(projectStatusPath), `${JSON.stringify(projectStatus, null, 2)}\n`);
}

export function loadComponent(componentTag: string): ComponentStatusRecord {
  const component = readComponentStatusRecords().find((candidate) => candidate.tagName === componentTag);
  if (!component) {
    throw new Error(`Unknown component: ${componentTag}`);
  }

  return component;
}

export function listHookFiles(): string[] {
  const hookFiles = [".codex/hooks.json"];
  return hookFiles.filter((hookFile) => fs.existsSync(resolveProjectPath(hookFile)));
}

export function readComponentSources(component: ComponentStatusRecord): string[] {
  const sourcesPath = component.files.sources;
  if (!sourcesPath) {
    return [];
  }

  const sourcesJson = readJson(resolveProjectPath(sourcesPath));
  if (!isRecord(sourcesJson) || !Array.isArray(sourcesJson.sources)) {
    return [];
  }

  return sourcesJson.sources.filter((source): source is string => typeof source === "string");
}

export function formatCommandList(commands: string[]): string {
  return commands.map((command) => `- \`${command}\``).join("\n");
}

function pickComponentSummary(component: ComponentStatusRecord): {
  tagName: string;
  category: string;
  sourceCount: number;
  certificationStatus: string;
} {
  return {
    tagName: component.tagName,
    category: component.category,
    sourceCount: component.sourceCount,
    certificationStatus: component.certificationStatus,
  };
}

function asNumberRecord(record: Record<string, unknown>): Record<string, number> {
  return Object.fromEntries(
    Object.entries(record)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, value]) => [key, Number(value)]),
  );
}

function walkProjectFiles(predicate: (filePath: string) => boolean): string[] {
  return walkFiles(projectRoot)
    .filter((filePath) => !filePath.includes(`${path.sep}.git${path.sep}`))
    .filter((filePath) => !filePath.includes(`${path.sep}node_modules${path.sep}`))
    .filter(predicate)
    .map(toProjectPath)
    .sort();
}

function walkFiles(directory: string): string[] {
  const entries = fs.existsSync(directory) ? fs.readdirSync(directory, { withFileTypes: true }) : [];
  const files: string[] = [];

  for (const entry of entries) {
    const fullPath = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      files.push(...walkFiles(fullPath));
    } else {
      files.push(fullPath);
    }
  }

  return files;
}

function toProjectPath(filePath: string): string {
  return path.relative(projectRoot, filePath);
}

export function readTextIfExists(projectPath: string): string | null {
  const absolutePath = resolveProjectPath(projectPath);
  return fs.existsSync(absolutePath) ? fs.readFileSync(absolutePath, "utf8") : null;
}

export function commandOutput(command: string, args: string[]): string {
  return execFileSync(command, args, {
    cwd: projectRoot,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  });
}
