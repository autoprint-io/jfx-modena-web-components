#!/usr/bin/env node
import { collectComponentContext, projectRoot } from "./component-context.ts";
import { executeLoggedCodexRun } from "./codex-run-log.ts";
import { buildSourceTraceabilityPrompt } from "./prompts/source-traceability.prompt.ts";

function run(): void {
  const componentTag = process.argv[2];
  const printPrompt = process.argv.includes("--print-prompt");
  const outputIndex = process.argv.indexOf("--output");
  const outputPath = outputIndex >= 0 ? process.argv[outputIndex + 1] : null;

  if (!componentTag) {
    console.error("Usage: node --experimental-strip-types tools/codex/run-source-traceability.ts <jfx-tag> [--print-prompt] [--output file]");
    process.exit(1);
  }

  const context = collectComponentContext(componentTag);
  const contextJson = JSON.stringify(context, null, 2);
  const prompt = buildSourceTraceabilityPrompt(contextJson);

  if (printPrompt) {
    console.log(prompt);
    return;
  }

  const result = executeLoggedCodexRun({
    component: componentTag,
    stage: "source-traceability",
    cwd: projectRoot,
    schemaPath: "schemas/codex-source-traceability.schema.json",
    contextJson,
    prompt,
    outputPath,
  });

  if (result.stderr) {
    process.stderr.write(result.stderr);
  }

  if (!outputPath) {
    process.stdout.write(result.stdout);
  }

  process.stderr.write(`Codex run log: ${result.runDirectory}\n`);

  process.exitCode = result.exitCode;
}

run();
