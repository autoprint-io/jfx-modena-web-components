#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { isRecord, projectRoot, readJson, resolveProjectPath } from "../validators/validation-utils.ts";

type Step = {
  name: string;
  command: string;
  exitCode: number;
};

type Assertion = {
  name: string;
  passed: boolean;
  details?: unknown;
};

const steps: Step[] = [];
const assertions: Assertion[] = [];

function run(): void {
  runCommand("project-status", "npm run codex:project-status");
  assertJsonFile("project-status-json", "project-status.generated.json", (value) => {
    assertRecordNumber(value, ["components", "total"], 84);
    assertRecordNumber(value, ["codex", "agentCount"], 5);
    assertRecordNumber(value, ["codex", "skillCount"], 6);
  });

  runCommand("preflight", "npm run codex:preflight");
  const preflight = runJsonCommand("preflight-json", "npm run --silent codex:preflight -- --json");
  assert("preflight-no-failures", getArray(preflight, ["checks"]).every((check) => isRecord(check) && check.status !== "fail"), preflight);

  const classification = runJsonCommand("change-classifier-json", "npm run --silent codex:change-classifier -- --json");
  assert("change-classifier-areas", getArray(classification, ["areas"]).length > 0, classification);
  assert("change-classifier-files", getArray(classification, ["dirtyFiles"]).length > 0, classification);

  runCommand(
    "handoff",
    "npm run --silent codex:handoff -- --component jfx-checkbox --output .codex-runs/self-test/handoff.md",
  );
  assertTextFileContains("handoff-target", ".codex-runs/self-test/handoff.md", "Component: jfx-checkbox");

  runCommand(
    "closeout",
    "npm run --silent codex:closeout -- --component jfx-checkbox --output-dir .codex-runs/self-test/closeout",
  );
  assertJsonFile(".codex-runs/self-test/closeout/closeout.json", ".codex-runs/self-test/closeout/closeout.json", (value) => {
    assertRecordNumber(value, ["schemaVersion"], 1);
    assertArrayLength(value, ["failedCommands"], 0);
  });
  assertTextFileContains("closeout-handoff", ".codex-runs/self-test/closeout/handoff.md", "Component: jfx-checkbox");

  runCommand(
    "hook-session-start",
    "printf '%s' '{\"hook_event_name\":\"SessionStart\",\"source\":\"startup\"}' | node --experimental-strip-types tools/codex/hooks/session-start.ts",
  );
  assertHookLog("hook-session-start-log", ".codex-runs/hooks/session-start.json");

  runCommand(
    "hook-stop",
    "printf '%s' '{\"hook_event_name\":\"Stop\"}' | node --experimental-strip-types tools/codex/hooks/stop.ts",
  );
  assertHookLog("hook-stop-log", ".codex-runs/hooks/stop.json");

  runCommand("typecheck-tools", "npm run typecheck:tools");
  runCommand("diff-check", "git diff --check");

  const trackedCodexRuns = runCommandCapture("tracked-codex-runs", "git ls-files .codex-runs").stdout.trim();
  assert("codex-runs-untracked", trackedCodexRuns.length === 0, trackedCodexRuns);

  printReport();

  if (steps.some((step) => step.exitCode !== 0) || assertions.some((assertion) => !assertion.passed)) {
    process.exit(1);
  }
}

function runCommand(name: string, command: string): void {
  const result = runCommandCapture(name, command);
  if (result.exitCode !== 0) {
    if (result.stdout.trim()) {
      console.log(result.stdout.trim());
    }
    if (result.stderr.trim()) {
      console.error(result.stderr.trim());
    }
  }
}

function runCommandCapture(name: string, command: string): { exitCode: number; stdout: string; stderr: string } {
  const result = spawnSync(command, {
    cwd: projectRoot,
    shell: true,
    encoding: "utf8",
  });
  const exitCode = result.status ?? 1;
  steps.push({ name, command, exitCode });

  return {
    exitCode,
    stdout: result.stdout ?? "",
    stderr: result.stderr ?? "",
  };
}

function runJsonCommand(name: string, command: string): unknown {
  const result = runCommandCapture(name, command);
  if (result.exitCode !== 0) {
    assert(name, false, result.stderr || result.stdout);
    return null;
  }

  try {
    return JSON.parse(result.stdout);
  } catch (error) {
    assert(name, false, `JSON parse failed: ${String(error)}`);
    return null;
  }
}

function assertJsonFile(name: string, projectPath: string, validate?: (value: unknown) => void): void {
  const absolutePath = resolveProjectPath(projectPath);
  if (!fs.existsSync(absolutePath)) {
    assert(name, false, `${projectPath} missing`);
    return;
  }

  try {
    const value = readJson(absolutePath);
    assert(name, true);
    validate?.(value);
  } catch (error) {
    assert(name, false, String(error));
  }
}

function assertTextFileContains(name: string, projectPath: string, expected: string): void {
  const absolutePath = resolveProjectPath(projectPath);
  if (!fs.existsSync(absolutePath)) {
    assert(name, false, `${projectPath} missing`);
    return;
  }

  const text = fs.readFileSync(absolutePath, "utf8");
  assert(name, text.includes(expected), { projectPath, expected });
}

function assertHookLog(name: string, projectPath: string): void {
  assertJsonFile(name, projectPath, (value) => {
    assertRecordNumber(value, ["schemaVersion"], 1);
    assertRecordNumber(value, ["result", "exitCode"], 0);
  });
}

function assertRecordNumber(value: unknown, pathParts: string[], expected: number): void {
  const actual = getPath(value, pathParts);
  assert(pathParts.join("."), actual === expected, { expected, actual });
}

function assertArrayLength(value: unknown, pathParts: string[], expected: number): void {
  const actual = getPath(value, pathParts);
  assert(pathParts.join("."), Array.isArray(actual) && actual.length === expected, { expected, actual });
}

function getArray(value: unknown, pathParts: string[]): unknown[] {
  const actual = getPath(value, pathParts);
  return Array.isArray(actual) ? actual : [];
}

function getPath(value: unknown, pathParts: string[]): unknown {
  let current = value;
  for (const part of pathParts) {
    if (!isRecord(current)) {
      return undefined;
    }
    current = current[part];
  }
  return current;
}

function assert(name: string, passed: boolean, details?: unknown): void {
  assertions.push({ name, passed, details });
}

function printReport(): void {
  console.log("Codex self-test");
  console.log("");
  console.log("Steps:");
  for (const step of steps) {
    console.log(`- ${step.exitCode === 0 ? "PASS" : "FAIL"} ${step.name}: ${step.command}`);
  }
  console.log("");
  console.log("Assertions:");
  for (const assertion of assertions) {
    const details = assertion.passed || assertion.details === undefined ? "" : ` ${JSON.stringify(assertion.details)}`;
    console.log(`- ${assertion.passed ? "PASS" : "FAIL"} ${assertion.name}${details}`);
  }

  const failedSteps = steps.filter((step) => step.exitCode !== 0).length;
  const failedAssertions = assertions.filter((assertion) => !assertion.passed).length;
  console.log("");
  console.log(`Self-test: ${failedSteps} failed step(s), ${failedAssertions} failed assertion(s)`);
}

run();
