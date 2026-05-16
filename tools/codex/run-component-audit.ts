#!/usr/bin/env node
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { buildComponentAuditPrompt } from "./prompts/audit-component.prompt.ts";
import { collectComponentContext, projectRoot } from "./component-context.ts";

function run(): void {
  const componentTag = process.argv[2];
  const printPrompt = process.argv.includes("--print-prompt");
  const outputIndex = process.argv.indexOf("--output");
  const outputPath = outputIndex >= 0 ? process.argv[outputIndex + 1] : null;

  if (!componentTag) {
    console.error("Usage: node --experimental-strip-types tools/codex/run-component-audit.ts <jfx-tag> [--print-prompt] [--output file]");
    process.exit(1);
  }

  const context = collectComponentContext(componentTag);
  const prompt = buildComponentAuditPrompt(JSON.stringify(context, null, 2));

  if (printPrompt) {
    console.log(prompt);
    return;
  }

  const result = spawnSync(
    "codex",
    [
      "exec",
      "--skip-git-repo-check",
      "--sandbox",
      "read-only",
      "--output-schema",
      "schemas/codex-component-audit.schema.json",
      "-",
    ],
    {
      cwd: projectRoot,
      input: prompt,
      encoding: "utf8",
    },
  );

  if (result.stderr) {
    process.stderr.write(result.stderr);
  }

  if (outputPath) {
    fs.mkdirSync(path.dirname(path.resolve(projectRoot, outputPath)), { recursive: true });
    fs.writeFileSync(path.resolve(projectRoot, outputPath), result.stdout, "utf8");
  } else {
    process.stdout.write(result.stdout);
  }

  process.exitCode = result.status ?? 1;
}

run();
