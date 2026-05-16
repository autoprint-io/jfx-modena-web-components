#!/usr/bin/env node
import { collectComponentContext, parseCollectOptions, projectRoot } from "./component-context.ts";
import { executeLoggedCodexRun } from "./codex-run-log.ts";
import { codexStages, getCodexStage } from "./codex-stages.ts";

type StageCliArgs = {
  component: string | null;
  stage: string | null;
  printPrompt: boolean;
  outputPath: string | null;
};

function parseArgs(argv: string[]): StageCliArgs {
  const args: StageCliArgs = {
    component: null,
    stage: null,
    printPrompt: false,
    outputPath: null,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--") {
      continue;
    } else if (arg === "--component") {
      args.component = argv[index + 1] ?? null;
      index += 1;
    } else if (arg === "--stage") {
      args.stage = argv[index + 1] ?? null;
      index += 1;
    } else if (arg === "--print-prompt") {
      args.printPrompt = true;
    } else if (arg === "--output") {
      args.outputPath = argv[index + 1] ?? null;
      index += 1;
    } else if (arg === "--full-sources" || arg === "--max-source-chars") {
      if (arg === "--max-source-chars") index += 1;
    } else {
      throw new Error(`Unknown argument: ${arg}`);
    }
  }

  return args;
}

function usage(): string {
  return `Usage: node --experimental-strip-types tools/codex/run-component-stage.ts --stage <stage> --component <jfx-tag> [--print-prompt] [--output file] [--full-sources] [--max-source-chars number]

Stages:
${codexStages.map((stage) => `- ${stage.id}`).join("\n")}
`;
}

export function runComponentStage(argv: string[]): void {
  const args = parseArgs(argv);
  if (!args.component || !args.stage) {
    console.error(usage());
    process.exit(1);
  }

  const stage = getCodexStage(args.stage);
  const context = collectComponentContext(
    args.component,
    parseCollectOptions(argv, { fullSources: stage.defaultFullSources }),
  );
  const contextJson = JSON.stringify(context, null, 2);
  const prompt = stage.buildPrompt(contextJson);

  if (args.printPrompt) {
    console.log(prompt);
    return;
  }

  const result = executeLoggedCodexRun({
    component: args.component,
    stage: stage.id,
    cwd: projectRoot,
    schemaPath: stage.schemaPath,
    contextJson,
    prompt,
    outputPath: args.outputPath,
  });

  if (result.stderr) {
    process.stderr.write(result.stderr);
  }

  if (!args.outputPath) {
    process.stdout.write(result.stdout);
  }

  process.stderr.write(`Codex run log: ${result.runDirectory}\n`);
  process.exitCode = result.exitCode;
}

if (process.argv[1]?.endsWith("run-component-stage.ts")) {
  runComponentStage(process.argv.slice(2));
}
