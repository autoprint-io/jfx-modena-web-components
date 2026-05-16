#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { getCodexStage } from "./codex-stages.ts";
import { projectRoot } from "./component-context.ts";
import { runComponentStage } from "./run-component-stage.ts";

type ComponentStatusRecord = {
  tagName: string;
  category: string;
  componentStatus: string;
};

type BatchArgs = {
  stage: string | null;
  all: boolean;
  category: string | null;
  status: string | null;
  limit: number | null;
  dryRun: boolean;
  execute: boolean;
};

function parseArgs(argv: string[]): BatchArgs {
  const args: BatchArgs = {
    stage: null,
    all: false,
    category: null,
    status: null,
    limit: null,
    dryRun: true,
    execute: false,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--") {
      continue;
    } else if (arg === "--stage") {
      args.stage = argv[index + 1] ?? null;
      index += 1;
    } else if (arg === "--all") {
      args.all = true;
    } else if (arg === "--category") {
      args.category = argv[index + 1] ?? null;
      index += 1;
    } else if (arg === "--status") {
      args.status = argv[index + 1] ?? null;
      index += 1;
    } else if (arg === "--limit") {
      const value = Number.parseInt(argv[index + 1] ?? "", 10);
      if (!Number.isSafeInteger(value) || value < 1) {
        throw new Error(`--limit must be a positive integer: ${argv[index + 1] ?? ""}`);
      }
      args.limit = value;
      index += 1;
    } else if (arg === "--dry-run") {
      args.dryRun = true;
    } else if (arg === "--execute") {
      args.execute = true;
      args.dryRun = false;
    } else {
      throw new Error(`Unknown argument: ${arg}`);
    }
  }

  return args;
}

function readComponents(): ComponentStatusRecord[] {
  const statusPath = path.join(projectRoot, "packages/components/src/component-status.json");
  const status = JSON.parse(fs.readFileSync(statusPath, "utf8")) as { components?: unknown };
  if (!Array.isArray(status.components)) {
    throw new Error("Invalid component-status.json shape.");
  }

  return status.components.filter((record): record is ComponentStatusRecord => {
    return (
      typeof record === "object" &&
      record !== null &&
      "tagName" in record &&
      "category" in record &&
      "componentStatus" in record &&
      typeof record.tagName === "string" &&
      typeof record.category === "string" &&
      typeof record.componentStatus === "string"
    );
  });
}

function usage(): string {
  return "Usage: node --experimental-strip-types tools/codex/run-component-stage-batch.ts --stage <stage> [--all] [--category category] [--status status] [--limit n] [--dry-run] [--execute]";
}

function run(): void {
  const args = parseArgs(process.argv.slice(2));
  if (!args.stage) {
    console.error(usage());
    process.exit(1);
  }

  const stage = getCodexStage(args.stage);
  let components = readComponents();

  if (!args.all && !args.category && !args.status) {
    throw new Error("Select components with --all, --category, or --status.");
  }

  if (args.category) {
    components = components.filter((component) => component.category === args.category);
  }

  if (args.status) {
    components = components.filter((component) => component.componentStatus === args.status);
  }

  if (args.limit !== null) {
    components = components.slice(0, args.limit);
  }

  const plannedCommands = components.map((component) => {
    return `npm run --silent codex:stage -- --stage ${stage.id} --component ${component.tagName} --output .codex-runs/${component.tagName}-${stage.id}.json`;
  });

  console.log(JSON.stringify(
    {
      mode: args.execute ? "execute" : "dry-run",
      stage: stage.id,
      selectedCount: components.length,
      components: components.map((component) => ({
        tagName: component.tagName,
        category: component.category,
        componentStatus: component.componentStatus,
      })),
      plannedCommands,
    },
    null,
    2,
  ));

  if (!args.execute) {
    return;
  }

  for (const component of components) {
    runComponentStage([
      "--stage",
      stage.id,
      "--component",
      component.tagName,
      "--output",
      `.codex-runs/${component.tagName}-${stage.id}.json`,
    ]);
    if (process.exitCode && process.exitCode !== 0) {
      return;
    }
  }
}

run();
