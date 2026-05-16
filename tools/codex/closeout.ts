#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { buildChangeClassification } from "./change-classifier.ts";
import { buildProjectStatus, getGitSnapshot, projectStatusPath, writeProjectStatus } from "./project-automation-utils.ts";
import { projectRoot, resolveProjectPath } from "../validators/validation-utils.ts";

type Options = {
  component: string | null;
  outputDir: string;
  runChecks: boolean;
  full: boolean;
  json: boolean;
};

type CommandResult = {
  command: string;
  exitCode: number;
  stdout: string;
  stderr: string;
};

type CloseoutReport = {
  schemaVersion: 1;
  generatedBy: string;
  mode: "dry-run" | "run-checks" | "full";
  component: string | null;
  outputDir: string;
  gitBefore: ReturnType<typeof getGitSnapshot>;
  gitAfter: ReturnType<typeof getGitSnapshot>;
  classification: ReturnType<typeof buildChangeClassification>;
  projectStatusPath: string;
  handoffPath: string;
  commandPlan: string[];
  commandResults: CommandResult[];
  failedCommands: string[];
};

function parseOptions(argv: string[]): Options {
  const options: Options = {
    component: null,
    outputDir: ".codex-runs/current",
    runChecks: false,
    full: false,
    json: false,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--component") {
      options.component = argv[++index] ?? null;
    } else if (arg === "--output-dir") {
      options.outputDir = argv[++index] ?? options.outputDir;
    } else if (arg === "--run-checks") {
      options.runChecks = true;
    } else if (arg === "--full") {
      options.full = true;
      options.runChecks = true;
    } else if (arg === "--json") {
      options.json = true;
    } else {
      throw new Error(`Unknown argument: ${arg}`);
    }
  }

  return options;
}

function run(): void {
  const options = parseOptions(process.argv.slice(2));
  const outputDir = resolveProjectPath(options.outputDir);
  fs.mkdirSync(outputDir, { recursive: true });

  const gitBefore = getGitSnapshot();
  const projectStatus = buildProjectStatus();
  writeProjectStatus(projectStatus);

  const classification = buildChangeClassification();
  const commandPlan = buildCommandPlan(options, classification);
  const commandResults = options.runChecks ? commandPlan.map(runCommand) : [];

  const handoffPath = path.join(options.outputDir, "handoff.md");
  const handoffResult = runNodeScript([
    "tools/codex/generate-handoff.ts",
    ...(options.component ? ["--component", options.component] : []),
    "--output",
    handoffPath,
  ]);
  commandResults.push({
    command: `node --experimental-strip-types tools/codex/generate-handoff.ts${options.component ? ` --component ${options.component}` : ""} --output ${handoffPath}`,
    ...handoffResult,
  });

  const gitAfter = getGitSnapshot();
  const report: CloseoutReport = {
    schemaVersion: 1,
    generatedBy: "tools/codex/closeout.ts",
    mode: options.full ? "full" : options.runChecks ? "run-checks" : "dry-run",
    component: options.component,
    outputDir: options.outputDir,
    gitBefore,
    gitAfter,
    classification,
    projectStatusPath,
    handoffPath,
    commandPlan,
    commandResults,
    failedCommands: commandResults.filter((result) => result.exitCode !== 0).map((result) => result.command),
  };

  const closeoutPath = path.join(outputDir, "closeout.json");
  fs.writeFileSync(closeoutPath, `${JSON.stringify(report, null, 2)}\n`);

  if (options.json) {
    console.log(JSON.stringify(report, null, 2));
  } else {
    printHuman(report);
  }

  if (report.failedCommands.length > 0) {
    process.exit(1);
  }
}

function buildCommandPlan(options: Options, classification: ReturnType<typeof buildChangeClassification>): string[] {
  if (options.full) {
    return ["npm run verify", "git diff --check", "npm run codex:preflight"];
  }

  const commands = [
    ...classification.requiredCommands,
    ...classification.recommendedCommands,
  ].filter((command) => command !== "npm run codex:project-status");

  const uniqueCommands = [...new Set(commands)];
  if (!uniqueCommands.includes("npm run verify")) {
    return uniqueCommands;
  }

  return uniqueCommands.filter((command) => {
    if (command === "npm run verify") {
      return true;
    }

    if (
      command === "pnpm typecheck"
      || command === "pnpm build"
      || command === "npm run typecheck:tools"
      || command === "npm run compute:tokens"
      || command === "npm run generate:component-manifests"
      || command === "npm run validate:components"
      || command === "npm run extract:clean-sources -- --dry-run"
      || command === "pnpm --filter @autoprint/jfx-modena-components test"
    ) {
      return false;
    }

    return true;
  });
}

function runCommand(command: string): CommandResult {
  const result = spawnSync(command, {
    cwd: projectRoot,
    shell: true,
    encoding: "utf8",
  });

  return {
    command,
    exitCode: result.status ?? 1,
    stdout: result.stdout ?? "",
    stderr: result.stderr ?? "",
  };
}

function runNodeScript(args: string[]): Omit<CommandResult, "command"> {
  const result = spawnSync("node", ["--experimental-strip-types", ...args], {
    cwd: projectRoot,
    encoding: "utf8",
  });

  return {
    exitCode: result.status ?? 1,
    stdout: result.stdout ?? "",
    stderr: result.stderr ?? "",
  };
}

function printHuman(report: CloseoutReport): void {
  console.log(`Closeout mode: ${report.mode}`);
  console.log(`Output dir: ${report.outputDir}`);
  console.log(`Areas: ${report.classification.areas.length > 0 ? report.classification.areas.join(", ") : "none"}`);
  console.log(`Project status: ${report.projectStatusPath}`);
  console.log(`Handoff: ${report.handoffPath}`);
  console.log("");

  if (report.commandPlan.length === 0) {
    console.log("Command plan: none");
  } else {
    console.log("Command plan:");
    for (const command of report.commandPlan) {
      console.log(`- ${command}`);
    }
  }

  if (report.commandResults.length > 0) {
    console.log("");
    console.log("Command results:");
    for (const result of report.commandResults) {
      console.log(`- exit ${result.exitCode}: ${result.command}`);
    }
  }

  console.log("");
  console.log(`Failed commands: ${report.failedCommands.length}`);
}

run();
