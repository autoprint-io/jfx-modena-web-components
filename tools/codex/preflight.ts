#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { isRecord, readJson, resolveProjectPath } from "../validators/validation-utils.ts";
import {
  buildProjectStatus,
  listHookFiles,
  listAgentFiles,
  listInstructionFiles,
  listSkillFiles,
  projectStatusPath,
  readAgentName,
  readSkillName,
  runGit,
} from "./project-automation-utils.ts";
import { runnerOutputSchemaPaths } from "./codex-stages.ts";

type CheckStatus = "pass" | "warn" | "fail";

type Check = {
  id: string;
  status: CheckStatus;
  message: string;
  details?: unknown;
};

const jsonMode = process.argv.includes("--json");
const checks: Check[] = [];

function addCheck(id: string, status: CheckStatus, message: string, details?: unknown): void {
  checks.push({ id, status, message, details });
}

function fileExists(projectPath: string): boolean {
  return fs.existsSync(resolveProjectPath(projectPath));
}

function checkRequiredFiles(): void {
  const requiredFiles = [
    "AGENTS.md",
    ".codex/config.toml",
    "package.json",
    "pnpm-workspace.yaml",
    "packages/components/src/component-status.json",
    "reference-sources/manifests/source-index.json",
  ];
  const missing = requiredFiles.filter((filePath) => !fileExists(filePath));
  addCheck(
    "required-files",
    missing.length === 0 ? "pass" : "fail",
    missing.length === 0 ? "Required project files exist." : "Required project files are missing.",
    missing,
  );
}

function checkProjectStatus(): void {
  try {
    const status = buildProjectStatus();
    const exists = fileExists(projectStatusPath);
    addCheck(
      "project-status",
      exists ? "pass" : "warn",
      exists ? `${projectStatusPath} exists and can be regenerated.` : `${projectStatusPath} is missing; run npm run codex:project-status.`,
      {
        components: status.components.total,
        agents: status.codex.agentCount,
        skills: status.codex.skillCount,
      },
    );
  } catch (error) {
    addCheck("project-status", "fail", "Project status cannot be built.", String(error));
  }
}

function checkGit(): void {
  const root = runGit(["rev-parse", "--show-toplevel"]);
  if (root.exitCode !== 0) {
    addCheck("git-root", "fail", "Project is not inside a Git repository.", root.stderr.trim());
    return;
  }

  addCheck("git-root", "pass", "Git repository detected.", root.stdout.trim());

  const status = runGit(["status", "--short"]);
  addCheck(
    "git-status",
    status.stdout.trim().length === 0 ? "pass" : "warn",
    status.stdout.trim().length === 0 ? "Git worktree is clean." : "Git worktree has local changes; preserve unrelated edits.",
    status.stdout.trimEnd().split("\n").filter((line) => line.trim().length > 0),
  );
}

function checkIgnoredArtifacts(): void {
  const codexRuns = runGit(["check-ignore", ".codex-runs/test"]);
  addCheck(
    "codex-runs-ignored",
    codexRuns.exitCode === 0 ? "pass" : "fail",
    codexRuns.exitCode === 0 ? ".codex-runs/ is ignored." : ".codex-runs/ is not ignored.",
    codexRuns.stdout.trim() || codexRuns.stderr.trim(),
  );

  const tracked = runGit(["ls-files"]);
  const trackedFiles = tracked.stdout.split("\n").filter(Boolean);
  const trackedCodexRuns = trackedFiles.filter((filePath) => filePath.startsWith(".codex-runs/"));
  addCheck(
    "codex-runs-untracked",
    trackedCodexRuns.length === 0 ? "pass" : "fail",
    trackedCodexRuns.length === 0 ? "No .codex-runs files are tracked." : ".codex-runs files are tracked.",
    trackedCodexRuns,
  );

  const trackedGenerated = trackedFiles.filter((filePath) =>
    filePath.includes("/test-results/")
    || filePath.startsWith("playwright-report/")
    || filePath === ".DS_Store"
  );
  addCheck(
    "generated-artifacts",
    trackedGenerated.length === 0 ? "pass" : "warn",
    trackedGenerated.length === 0 ? "No known disposable runtime artifacts are tracked." : "Known disposable runtime artifacts are tracked.",
    trackedGenerated,
  );
}

function checkSkills(): void {
  const skillFiles = listSkillFiles();
  const invalid: string[] = [];
  const names: string[] = [];

  for (const skillFile of skillFiles) {
    const source = fs.readFileSync(resolveProjectPath(skillFile), "utf8");
    if (!source.startsWith("---\n") || !/^description:\s*.+$/m.test(source)) {
      invalid.push(skillFile);
      continue;
    }
    try {
      names.push(readSkillName(skillFile));
    } catch {
      invalid.push(skillFile);
    }
  }

  addCheck(
    "skills",
    invalid.length === 0 && skillFiles.length > 0 ? "pass" : "fail",
    invalid.length === 0 ? "Repo-local skills have required frontmatter." : "Some repo-local skills are invalid.",
    { count: skillFiles.length, names: names.sort(), invalid },
  );
}

function checkAgents(): void {
  const agentFiles = listAgentFiles();
  const invalid: string[] = [];
  const names: string[] = [];

  for (const agentFile of agentFiles) {
    const source = fs.readFileSync(resolveProjectPath(agentFile), "utf8");
    const requiredKeys = ["name", "description", "developer_instructions"];
    const missing = requiredKeys.filter((key) => !new RegExp(`(^|\\n)${key}[ \\t]*=`).test(source));
    if (missing.length > 0) {
      invalid.push(`${agentFile}: missing ${missing.join(", ")}`);
      continue;
    }
    try {
      names.push(readAgentName(agentFile));
    } catch {
      invalid.push(agentFile);
    }
  }

  addCheck(
    "custom-agents",
    invalid.length === 0 && agentFiles.length > 0 ? "pass" : "fail",
    invalid.length === 0 ? "Project custom agents have required fields." : "Some project custom agents are invalid.",
    { count: agentFiles.length, names: names.sort(), invalid },
  );
}

function checkInstructions(): void {
  const instructionFiles = listInstructionFiles();
  const overrides = instructionFiles.filter((filePath) => filePath.endsWith("AGENTS.override.md"));
  addCheck(
    "instructions",
    overrides.length === 0 ? "pass" : "warn",
    overrides.length === 0 ? "Instruction files found with no project AGENTS.override.md." : "AGENTS.override.md files exist and can override normal guidance.",
    instructionFiles,
  );
}

function checkHooks(): void {
  const hookFiles = listHookFiles();
  const invalid: string[] = [];

  for (const hookFile of hookFiles) {
    try {
      const source = readJson(resolveProjectPath(hookFile));
      if (!isRecord(source) || !isRecord(source.hooks)) {
        invalid.push(`${hookFile}: missing hooks object`);
      }
    } catch (error) {
      invalid.push(`${hookFile}: ${String(error)}`);
    }
  }

  addCheck(
    "hooks",
    invalid.length === 0 ? "pass" : "fail",
    invalid.length === 0 ? "Project hooks are parseable." : "Project hooks are invalid.",
    { hookFiles, invalid },
  );
}

function checkSchemas(): void {
  const unsupportedKeywords = ["uniqueItems"];
  const findings: string[] = [];

  for (const schemaPath of runnerOutputSchemaPaths) {
    const schema = readJson(resolveProjectPath(schemaPath));
    collectUnsupported(schema, schemaPath, "$", unsupportedKeywords, findings);
  }

  addCheck(
    "codex-output-schemas",
    findings.length === 0 ? "pass" : "fail",
    findings.length === 0 ? "Codex output schemas avoid known unsupported keywords." : "Codex output schemas contain unsupported keywords.",
    findings,
  );
}

function collectUnsupported(value: unknown, schemaPath: string, location: string, keywords: string[], findings: string[]): void {
  if (Array.isArray(value)) {
    value.forEach((item, index) => collectUnsupported(item, schemaPath, `${location}[${index}]`, keywords, findings));
    return;
  }

  if (!isRecord(value)) {
    return;
  }

  for (const [key, nestedValue] of Object.entries(value)) {
    const nestedLocation = location === "$" ? `$.${key}` : `${location}.${key}`;
    if (keywords.includes(key)) {
      findings.push(`${schemaPath}: ${key} at ${nestedLocation}`);
    }
    collectUnsupported(nestedValue, schemaPath, nestedLocation, keywords, findings);
  }
}

function printHuman(): void {
  for (const check of checks) {
    const marker = check.status === "pass" ? "PASS" : check.status === "warn" ? "WARN" : "FAIL";
    console.log(`${marker} ${check.id}: ${check.message}`);
    if (check.status !== "pass" && check.details !== undefined) {
      console.log(JSON.stringify(check.details, null, 2));
    }
  }

  const failCount = checks.filter((check) => check.status === "fail").length;
  const warnCount = checks.filter((check) => check.status === "warn").length;
  console.log(`Preflight: ${failCount} failure(s), ${warnCount} warning(s)`);
}

checkRequiredFiles();
checkProjectStatus();
checkGit();
checkIgnoredArtifacts();
checkSkills();
checkAgents();
checkInstructions();
checkHooks();
checkSchemas();

if (jsonMode) {
  console.log(JSON.stringify({ checks }, null, 2));
} else {
  printHuman();
}

if (checks.some((check) => check.status === "fail")) {
  process.exit(1);
}
