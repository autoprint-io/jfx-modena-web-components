import { spawnSync } from "node:child_process";
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";

type CodexRunOptions = {
  component: string;
  stage: string;
  cwd: string;
  schemaPath: string;
  contextJson: string;
  prompt: string;
  outputPath: string | null;
};

type CodexRunResult = {
  exitCode: number;
  stdout: string;
  stderr: string;
  runDirectory: string;
};

function sha256(text: string): string {
  return crypto.createHash("sha256").update(text).digest("hex");
}

function runGit(cwd: string, args: string[]): string | null {
  const result = spawnSync("git", args, {
    cwd,
    encoding: "utf8",
  });

  if (result.status !== 0) {
    return null;
  }

  return result.stdout.trim();
}

function safePathSegment(value: string): string {
  return value.replace(/[^A-Za-z0-9._-]/g, "-");
}

function makeTimestamp(date: Date): string {
  return date.toISOString().replace(/[:.]/g, "-");
}

function writeText(filePath: string, text: string): void {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, text, "utf8");
}

export function executeLoggedCodexRun(options: CodexRunOptions): CodexRunResult {
  const startedAtDate = new Date();
  const startedAt = startedAtDate.toISOString();
  const command = "codex";
  const args = [
    "exec",
    "--skip-git-repo-check",
    "--sandbox",
    "read-only",
    "--output-schema",
    options.schemaPath,
    "-",
  ];

  const result = spawnSync(command, args, {
    cwd: options.cwd,
    input: options.prompt,
    encoding: "utf8",
  });

  const endedAtDate = new Date();
  const endedAt = endedAtDate.toISOString();
  const durationMs = endedAtDate.getTime() - startedAtDate.getTime();
  const stdout = result.stdout ?? "";
  const stderr = result.stderr ?? "";
  const exitCode = result.status ?? 1;
  const runDirectory = path.join(
    options.cwd,
    ".codex-runs",
    safePathSegment(options.component),
    safePathSegment(options.stage),
    makeTimestamp(startedAtDate),
  );

  writeText(path.join(runDirectory, "context.json"), options.contextJson);
  writeText(path.join(runDirectory, "prompt.md"), options.prompt);
  writeText(path.join(runDirectory, "stdout.txt"), stdout);
  writeText(path.join(runDirectory, "stderr.txt"), stderr);

  const runMetadata = {
    component: options.component,
    stage: options.stage,
    startedAt,
    endedAt,
    durationMs,
    cwd: options.cwd,
    schemaPath: options.schemaPath,
    command,
    args,
    exitCode,
    gitHead: runGit(options.cwd, ["rev-parse", "HEAD"]),
    gitStatusShort: runGit(options.cwd, ["status", "--short"]),
    sha256: {
      context: sha256(options.contextJson),
      prompt: sha256(options.prompt),
      stdout: sha256(stdout),
      stderr: sha256(stderr),
    },
  };

  writeText(path.join(runDirectory, "run.json"), `${JSON.stringify(runMetadata, null, 2)}\n`);

  if (options.outputPath) {
    const resolvedOutputPath = path.resolve(options.cwd, options.outputPath);
    writeText(resolvedOutputPath, stdout);
  }

  return {
    exitCode,
    stdout,
    stderr,
    runDirectory,
  };
}
