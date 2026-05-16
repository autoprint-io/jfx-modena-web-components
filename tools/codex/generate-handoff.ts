#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { resolveProjectPath } from "../validators/validation-utils.ts";
import {
  buildProjectStatus,
  formatCommandList,
  getGitSnapshot,
  loadComponent,
  readComponentSources,
} from "./project-automation-utils.ts";

type Options = {
  component: string | null;
  output: string | null;
};

function parseOptions(argv: string[]): Options {
  const options: Options = {
    component: null,
    output: null,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--component") {
      options.component = argv[++index] ?? null;
    } else if (arg === "--output") {
      options.output = argv[++index] ?? null;
    } else if (!arg.startsWith("--") && options.component === null) {
      options.component = arg;
    } else {
      throw new Error(`Unknown argument: ${arg}`);
    }
  }

  return options;
}

function run(): void {
  const options = parseOptions(process.argv.slice(2));
  const projectStatus = buildProjectStatus();
  const git = getGitSnapshot();
  const handoff = buildHandoffPrompt(options.component, projectStatus, git);

  if (options.output) {
    const outputPath = resolveProjectPath(options.output);
    fs.mkdirSync(path.dirname(outputPath), { recursive: true });
    fs.writeFileSync(outputPath, handoff);
    console.log(`Wrote: ${options.output}`);
    return;
  }

  console.log(handoff);
}

function buildHandoffPrompt(
  componentTag: string | null,
  projectStatus: ReturnType<typeof buildProjectStatus>,
  git: ReturnType<typeof getGitSnapshot>,
): string {
  const lines: string[] = [];

  lines.push("Use the repo-local instructions first: read AGENTS.md and use the local jfx-modena-web-components skill.");
  lines.push("");
  lines.push("You are continuing the JavaFX Modena Web Components project. Treat this as a source-backed, certification-gated repository, not a generic UI library.");
  lines.push("");
  lines.push("## Current Snapshot");
  lines.push("");
  lines.push(`- Branch: ${git.branch ?? "unknown"}`);
  lines.push(`- HEAD: ${git.head ?? "unknown"}`);
  lines.push(`- Git dirty: ${git.dirty ? "yes" : "no"}`);
  if (git.statusShort) {
    lines.push("- Current local changes to preserve:");
    lines.push(formatIndentedBlock(git.statusShort));
  }
  lines.push(`- Components: ${projectStatus.components.total}`);
  lines.push(`- Implemented partial: ${projectStatus.components.byStatus.implemented_partial ?? 0}`);
  lines.push(`- Scaffold only: ${projectStatus.components.byStatus.scaffold_only ?? 0}`);
  lines.push(`- Source-backed scaffolds: ${projectStatus.components.sourceBackedScaffolds.length}`);
  lines.push(`- Project custom agents available: ${projectStatus.codex.agents.join(", ")}`);
  lines.push(`- Repo skills available: ${projectStatus.codex.skills.join(", ")}`);
  lines.push("");

  if (componentTag) {
    const component = loadComponent(componentTag);
    const sources = readComponentSources(component);
    lines.push("## Target Component");
    lines.push("");
    lines.push(`- Component: ${component.tagName}`);
    lines.push(`- Category: ${component.category}`);
    lines.push(`- Directory: ${component.directory}`);
    lines.push(`- Component status: ${component.componentStatus}`);
    lines.push(`- Certification status: ${component.certificationStatus}`);
    lines.push(`- Source count: ${component.sourceCount}`);
    lines.push("");
    lines.push("Allowed component files to inspect/edit only if the task explicitly asks for implementation:");
    for (const [kind, filePath] of Object.entries(component.files)) {
      if (filePath) {
        lines.push(`- ${kind}: ${filePath}`);
      }
    }
    lines.push("");
    lines.push("Declared source authority:");
    if (sources.length === 0) {
      lines.push("- None yet. Run source-authority workflow before implementation.");
    } else {
      for (const source of sources) {
        lines.push(`- ${source}`);
      }
    }
    lines.push("");
  } else {
    lines.push("## Suggested First-Pass Candidates");
    lines.push("");
    for (const candidate of projectStatus.components.suggestedFirstPassCandidates.slice(0, 8)) {
      lines.push(`- ${candidate.tagName}: ${candidate.category}, sourceCount ${candidate.sourceCount}, ${candidate.certificationStatus}`);
    }
    lines.push("");
  }

  lines.push("## Required Workflow");
  lines.push("");
  lines.push("1. Run `npm run codex:preflight` before making changes.");
  lines.push("2. If doing component work, use `$jfx-component-first-pass` and read the target manifest, sources, current files, and sibling implemented components.");
  lines.push("3. If doing source-authority work, use `$jfx-source-authority`; do not use `.codex-runs/` as authority.");
  lines.push("4. If doing prompt/schema/runner work, use `$jfx-codex-pipeline`.");
  lines.push("5. Use subagents only when the task explicitly asks for delegation; recommended project agents are `jfx_source_explorer`, `jfx_component_worker`, `jfx_visual_verifier`, `jfx_reviewer`, and `jfx_prompt_pipeline_auditor`.");
  lines.push("6. Keep implementation narrow. Do not claim JavaFX/Modena certification.");
  lines.push("7. Run `npm run codex:project-status` after structural or component-status-affecting changes.");
  lines.push("8. End with exact commands, exit codes, assumptions, and confidence.");
  lines.push("");
  lines.push("## Verification Commands");
  lines.push("");
  lines.push(formatCommandList(projectStatus.verification.structuralCommands));
  lines.push("");
  lines.push("For non-trivial changes, run `npm run verify` unless a narrower verified scope is explicitly justified.");
  lines.push("");
  lines.push("## Non-Negotiable Guardrails");
  lines.push("");
  for (const guardrail of projectStatus.guardrails) {
    lines.push(`- ${guardrail}`);
  }
  lines.push("");

  return `${lines.join("\n")}\n`;
}

function formatIndentedBlock(value: string): string {
  return ["```text", value, "```"].join("\n");
}

run();
