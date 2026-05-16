#!/usr/bin/env node
import { collectComponentContext, parseCollectOptions } from "./component-context.ts";

function run(): void {
  const componentTag = process.argv[2];
  if (!componentTag) {
    console.error("Usage: node --experimental-strip-types tools/codex/collect-component-context.ts <jfx-tag> [--full-sources] [--max-source-chars number]");
    process.exit(1);
  }

  const context = collectComponentContext(componentTag, parseCollectOptions(process.argv.slice(3)));
  console.log(JSON.stringify(context, null, 2));
}

run();
