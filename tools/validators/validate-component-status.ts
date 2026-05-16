#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import {
  classifyComponentSource,
  componentsRoot,
  isRecord,
  isStringArray,
  readJson,
  relativePath,
  resolveProjectPath,
  ValidationReporter,
  walkFiles,
} from "./validation-utils.ts";
import type { ComponentStatusRecord } from "./validation-utils.ts";

const statusPath = resolveProjectPath("packages/components/src/component-status.json");
const allowedComponentStatuses = new Set(["implemented_partial", "scaffold_only"]);
const allowedCertificationStatuses = new Set(["not_certified_behavior_visual_a11y_incomplete", "missing_implementation"]);

function assertNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isInteger(value) && value >= 0;
}

function readSourceCount(sourcesPath: string | null): number {
  if (!sourcesPath) {
    return 0;
  }

  const value = readJson(resolveProjectPath(sourcesPath));
  if (!isRecord(value) || !isStringArray(value.sources)) {
    return 0;
  }

  return value.sources.length;
}

function validateRecord(record: unknown, index: number, reporter: ValidationReporter): record is ComponentStatusRecord {
  const label = `components[${index}]`;

  if (!isRecord(record)) {
    reporter.error(relativePath(statusPath), `${label} must be an object.`);
    return false;
  }

  for (const key of ["tagName", "category", "directory", "componentStatus", "certificationStatus"]) {
    if (typeof record[key] !== "string" || record[key] === "") {
      reporter.error(relativePath(statusPath), `${label}.${key} must be a non-empty string.`);
    }
  }

  if (typeof record.componentStatus === "string" && !allowedComponentStatuses.has(record.componentStatus)) {
    reporter.error(relativePath(statusPath), `${label}.componentStatus is not supported: ${record.componentStatus}`);
  }

  if (typeof record.certificationStatus === "string" && !allowedCertificationStatuses.has(record.certificationStatus)) {
    reporter.error(relativePath(statusPath), `${label}.certificationStatus is not supported: ${record.certificationStatus}`);
  }

  if (!assertNumber(record.sourceCount)) {
    reporter.error(relativePath(statusPath), `${label}.sourceCount must be a non-negative integer.`);
  }

  if (!isRecord(record.files)) {
    reporter.error(relativePath(statusPath), `${label}.files must be an object.`);
    return false;
  }

  if (typeof record.files.manifest !== "string") {
    reporter.error(relativePath(statusPath), `${label}.files.manifest must be a string.`);
  }

  for (const key of ["component", "template", "styles", "sources", "unitTest", "accessibilityTest"]) {
    const value = record.files[key];
    if (value !== null && typeof value !== "string") {
      reporter.error(relativePath(statusPath), `${label}.files.${key} must be a string or null.`);
    }
  }

  return true;
}

function run(): void {
  const reporter = new ValidationReporter();
  const status = readJson(statusPath);

  if (!isRecord(status)) {
    reporter.error(relativePath(statusPath), "Component status must be an object.");
    reporter.finish("Component status validation");
    return;
  }

  if (status.version !== 1) {
    reporter.error(relativePath(statusPath), "`version` must be 1.");
  }

  if (!isRecord(status.counts)) {
    reporter.error(relativePath(statusPath), "`counts` must be an object.");
  }

  if (!Array.isArray(status.components)) {
    reporter.error(relativePath(statusPath), "`components` must be an array.");
    reporter.finish("Component status validation");
    return;
  }

  const manifestCount = walkFiles(componentsRoot).filter((filePath) => filePath.endsWith(".manifest.json")).length;
  if (status.components.length !== manifestCount) {
    reporter.error(relativePath(statusPath), `components length ${status.components.length} does not match manifest count ${manifestCount}.`);
  }

  const seenTags = new Set<string>();
  const counts = {
    implemented_partial: 0,
    scaffold_only: 0,
  };
  const byCategory: Record<string, number> = {};

  status.components.forEach((record, index) => {
    if (!validateRecord(record, index, reporter)) {
      return;
    }

    if (seenTags.has(record.tagName)) {
      reporter.error(relativePath(statusPath), `Duplicate tagName: ${record.tagName}`);
    }
    seenTags.add(record.tagName);

    counts[record.componentStatus] += 1;
    byCategory[record.category] = (byCategory[record.category] ?? 0) + 1;

    const manifestPath = resolveProjectPath(record.files.manifest);
    if (!fs.existsSync(manifestPath)) {
      reporter.error(relativePath(statusPath), `Manifest does not exist for ${record.tagName}: ${record.files.manifest}`);
    }

    for (const [fileKind, filePath] of Object.entries(record.files)) {
      if (filePath !== null && !fs.existsSync(resolveProjectPath(filePath))) {
        reporter.error(relativePath(statusPath), `${fileKind} file does not exist for ${record.tagName}: ${filePath}`);
      }
    }

    const absoluteComponentPath = record.files.component ? resolveProjectPath(record.files.component) : null;
    const derivedStatus = classifyComponentSource(absoluteComponentPath);
    if (derivedStatus !== record.componentStatus) {
      reporter.error(
        relativePath(statusPath),
        `${record.tagName} componentStatus ${record.componentStatus} does not match derived status ${derivedStatus}.`,
      );
    }

    const actualSourceCount = readSourceCount(record.files.sources);
    if (actualSourceCount !== record.sourceCount) {
      reporter.error(
        relativePath(statusPath),
        `${record.tagName} sourceCount ${record.sourceCount} does not match sources file count ${actualSourceCount}.`,
      );
    }

    if (record.componentStatus === "scaffold_only" && record.certificationStatus !== "missing_implementation") {
      reporter.error(relativePath(statusPath), `${record.tagName} scaffold components must use missing_implementation certificationStatus.`);
    }

    if (
      record.componentStatus === "implemented_partial" &&
      record.certificationStatus !== "not_certified_behavior_visual_a11y_incomplete"
    ) {
      reporter.error(relativePath(statusPath), `${record.tagName} partial implementations must remain not certified.`);
    }
  });

  if (isRecord(status.counts)) {
    if (status.counts.total !== status.components.length) {
      reporter.error(relativePath(statusPath), "`counts.total` does not match component length.");
    }

    if (isRecord(status.counts.byStatus)) {
      for (const key of Object.keys(counts) as Array<keyof typeof counts>) {
        if (status.counts.byStatus[key] !== counts[key]) {
          reporter.error(relativePath(statusPath), `counts.byStatus.${key} does not match generated count.`);
        }
      }
    }

    if (isRecord(status.counts.byCategory)) {
      for (const [category, count] of Object.entries(byCategory)) {
        if (status.counts.byCategory[category] !== count) {
          reporter.error(relativePath(statusPath), `counts.byCategory.${category} does not match generated count.`);
        }
      }
    }
  }

  console.log(`Component status records: ${status.components.length}`);
  console.log(`Implemented partial: ${counts.implemented_partial}`);
  console.log(`Scaffold only: ${counts.scaffold_only}`);
  reporter.finish("Component status validation");
}

run();
