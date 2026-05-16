#!/usr/bin/env node
import { printHookSummary, readHookEvent, runNpmScript, writeHookLog } from "./hook-utils.ts";

async function run(): Promise<void> {
  const startedAtMs = Date.now();
  const event = await readHookEvent();
  const result = runNpmScript(["run", "codex:closeout"]);
  writeHookLog("stop", result.command, startedAtMs, event, result);
  printHookSummary("stop", result);

  // Closeout is advisory in hooks. Manual `codex:closeout -- --run-checks` remains authoritative.
  process.exit(0);
}

run().catch((error) => {
  console.log(`[stop] hook wrapper failed: ${String(error)}`);
  process.exit(0);
});
