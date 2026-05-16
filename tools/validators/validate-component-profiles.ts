#!/usr/bin/env node
import fs from "node:fs";
import { buildComponentProfile } from "../codex/component-profile.ts";
import { isRecord, readJson, relativePath, resolveProjectPath, ValidationReporter } from "./validation-utils.ts";

const statusPath = resolveProjectPath("packages/components/src/component-status.json");
const allowedWorkflows = new Set([
  "chart-component",
  "choice-component",
  "container-component",
  "content-component",
  "control-component",
  "data-component",
  "media-component",
  "menu-component",
  "misc-component",
  "shape-component",
  "text-input-component",
  "generic-component",
]);

function run(): void {
  const reporter = new ValidationReporter();
  const status = readJson(statusPath);

  if (!isRecord(status) || !Array.isArray(status.components)) {
    reporter.error(relativePath(statusPath), "Invalid component-status.json shape.");
    reporter.finish("Component profile validation");
    return;
  }

  let generatedProfiles = 0;
  let overriddenProfiles = 0;

  for (const record of status.components) {
    if (!isRecord(record)) {
      reporter.error(relativePath(statusPath), "Component status entry must be an object.");
      continue;
    }

    const files = isRecord(record.files) ? record.files : {};
    const sourcesPath = typeof files.sources === "string" ? files.sources : null;
    const sources = sourcesPath && fs.existsSync(resolveProjectPath(sourcesPath)) ? readJson(resolveProjectPath(sourcesPath)) : {};
    const profile = buildComponentProfile(record, sources);

    generatedProfiles += 1;
    if (profile.overrideApplied) {
      overriddenProfiles += 1;
    }

    if (!profile.component.startsWith("jfx-")) {
      reporter.error(profile.component, "Profile component must use jfx-* naming.");
    }

    if (!allowedWorkflows.has(profile.workflow)) {
      reporter.error(profile.component, `Unsupported workflow: ${profile.workflow}`);
    }

    if (profile.allowedFiles.length === 0) {
      reporter.error(profile.component, "Profile must include allowedFiles.");
    }

    for (const allowedFile of profile.allowedFiles) {
      if (allowedFile.includes("..")) {
        reporter.error(profile.component, `allowedFiles must not contain parent traversal: ${allowedFile}`);
      }

      if (!allowedFile.startsWith("packages/components/src/")) {
        reporter.error(profile.component, `allowedFiles must stay under packages/components/src/: ${allowedFile}`);
      }
    }

    for (const sourcePath of profile.sourceAuthority) {
      if (!sourcePath.startsWith("reference-sources/")) {
        reporter.error(profile.component, `sourceAuthority must use reference-sources/ paths: ${sourcePath}`);
      }
    }
  }

  console.log(`Component profiles: ${generatedProfiles}`);
  console.log(`Override profiles: ${overriddenProfiles}`);
  reporter.finish("Component profile validation");
}

run();
