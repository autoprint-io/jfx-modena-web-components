import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { projectRoot, resolveProjectPath } from "../../validators/validation-utils.ts";

export type HookCommandResult = {
  command: string;
  exitCode: number;
  stdout: string;
  stderr: string;
};

export type HookLog = {
  schemaVersion: 1;
  hook: string;
  command: string;
  startedAt: string;
  finishedAt: string;
  durationMs: number;
  cwd: string;
  event: unknown;
  result: HookCommandResult;
};

export async function readHookEvent(): Promise<unknown> {
  const chunks: Buffer[] = [];

  for await (const chunk of process.stdin) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }

  const input = Buffer.concat(chunks).toString("utf8").trim();
  if (!input) {
    return null;
  }

  try {
    return JSON.parse(input);
  } catch {
    return { raw: input };
  }
}

export function runNpmScript(args: string[]): HookCommandResult {
  const command = `npm ${args.join(" ")}`;
  const result = spawnSync("npm", args, {
    cwd: projectRoot,
    encoding: "utf8",
  });

  return {
    command,
    exitCode: result.status ?? 1,
    stdout: result.stdout ?? "",
    stderr: result.stderr ?? "",
  };
}

export function writeHookLog(hook: string, command: string, startedAtMs: number, event: unknown, result: HookCommandResult): void {
  const finishedAtMs = Date.now();
  const log: HookLog = {
    schemaVersion: 1,
    hook,
    command,
    startedAt: new Date(startedAtMs).toISOString(),
    finishedAt: new Date(finishedAtMs).toISOString(),
    durationMs: finishedAtMs - startedAtMs,
    cwd: projectRoot,
    event,
    result,
  };

  const logDir = resolveProjectPath(".codex-runs/hooks");
  fs.mkdirSync(logDir, { recursive: true });
  fs.writeFileSync(path.join(logDir, `${hook}.json`), `${JSON.stringify(log, null, 2)}\n`);
}

export function printHookSummary(hook: string, result: HookCommandResult): void {
  const status = result.exitCode === 0 ? "ok" : `failed:${result.exitCode}`;
  console.log(`[${hook}] ${status}: ${result.command}`);
  if (result.exitCode !== 0 && result.stderr.trim()) {
    console.log(result.stderr.trim());
  }
}
