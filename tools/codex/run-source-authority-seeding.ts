#!/usr/bin/env node
import { runComponentStage } from "./run-component-stage.ts";

const [componentTag, ...rest] = process.argv.slice(2);

if (!componentTag) {
  console.error("Usage: node --experimental-strip-types tools/codex/run-source-authority-seeding.ts <jfx-tag> [--print-prompt] [--output file]");
  process.exit(1);
}

runComponentStage(["--stage", "source-authority-seeding", "--component", componentTag, ...rest]);
