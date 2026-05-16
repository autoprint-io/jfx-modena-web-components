#!/usr/bin/env node
import { collectComponentContext } from "./component-context.ts";

function run(): void {
  const componentTag = process.argv[2];
  if (!componentTag) {
    console.error("Usage: node --experimental-strip-types tools/codex/collect-component-context.ts <jfx-tag>");
    process.exit(1);
  }

  const context = collectComponentContext(componentTag);
  console.log(JSON.stringify(context, null, 2));
}

run();
