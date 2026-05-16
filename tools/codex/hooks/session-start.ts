#!/usr/bin/env node
import { printHookSummary, readHookEvent, runNpmScript, writeHookLog } from "./hook-utils.ts";

async function run(): Promise<void> {
  const startedAtMs = Date.now();
  const event = await readHookEvent();
  const result = runNpmScript(["run", "codex:preflight"]);
  writeHookLog("session-start", result.command, startedAtMs, event, result);
  printHookSummary("session-start", result);

  // Hooks are advisory here. Do not block a Codex session on project guidance checks.
  process.exit(0);
}

run().catch((error) => {
  console.log(`[session-start] hook wrapper failed: ${String(error)}`);
  process.exit(0);
});
