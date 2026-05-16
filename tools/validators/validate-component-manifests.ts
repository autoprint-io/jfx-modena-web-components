#!/usr/bin/env node
import path from "node:path";
import {
  classifyComponentSource,
  componentsRoot,
  isEmptyRecord,
  isRecord,
  isStringArray,
  readJson,
  relativePath,
  ValidationReporter,
  walkFiles,
} from "./validation-utils.ts";

const allowedStatuses = new Set(["scaffold_only", "implemented_partial"]);
const tagPattern = /^jfx-[a-z0-9]+(?:-[a-z0-9]+)*$/;

function validateFullManifest(filePath: string, value: Record<string, unknown>, reporter: ValidationReporter): void {
  const tagName = value.tagName;
  if (typeof tagName !== "string" || !tagPattern.test(tagName)) {
    reporter.error(relativePath(filePath), "`tagName` must be a valid jfx-* tag name.");
  }

  for (const key of ["javafxClass", "javafxStyleClass"]) {
    if (typeof value[key] !== "string" || value[key] === "") {
      reporter.error(relativePath(filePath), `\`${key}\` must be a non-empty string.`);
    }
  }

  if (typeof value.status !== "string" || !allowedStatuses.has(value.status)) {
    reporter.error(relativePath(filePath), "`status` must be scaffold_only or implemented_partial.");
  }

  for (const key of ["attributes", "parts", "states"]) {
    if (!isStringArray(value[key])) {
      reporter.error(relativePath(filePath), `\`${key}\` must be an array of strings.`);
    }
  }

  const allowedKeys = new Set(["tagName", "javafxClass", "javafxStyleClass", "status", "attributes", "parts", "states"]);
  for (const key of Object.keys(value)) {
    if (!allowedKeys.has(key)) {
      reporter.error(relativePath(filePath), `Unknown manifest key \`${key}\`.`);
    }
  }
}

function run(): void {
  const reporter = new ValidationReporter();
  const manifests = walkFiles(componentsRoot)
    .filter((filePath) => filePath.endsWith(".manifest.json"))
    .sort();

  let fullCount = 0;
  let scaffoldCount = 0;

  for (const manifestPath of manifests) {
    const manifest = readJson(manifestPath);
    const componentPath = manifestPath.replace(".manifest.json", ".ts");
    const derivedStatus = classifyComponentSource(componentPath);

    if (!isRecord(manifest)) {
      reporter.error(relativePath(manifestPath), "Manifest must be a JSON object.");
      continue;
    }

    if (isEmptyRecord(manifest)) {
      scaffoldCount += 1;
      if (derivedStatus !== "scaffold_only") {
        reporter.error(relativePath(manifestPath), "Implemented components must not use an empty manifest.");
      }
      continue;
    }

    fullCount += 1;
    validateFullManifest(manifestPath, manifest, reporter);

    if (manifest.status !== derivedStatus) {
      reporter.error(
        relativePath(manifestPath),
        `Manifest status \`${String(manifest.status)}\` does not match derived status \`${derivedStatus}\`.`,
      );
    }

    const expectedTag = path.basename(manifestPath, ".manifest.json");
    if (typeof manifest.tagName === "string" && manifest.tagName !== expectedTag) {
      reporter.error(relativePath(manifestPath), `tagName must match file basename \`${expectedTag}\`.`);
    }
  }

  console.log(`Component manifests: ${manifests.length}`);
  console.log(`Full manifests: ${fullCount}`);
  console.log(`Scaffold manifests: ${scaffoldCount}`);
  reporter.finish("Manifest validation");
}

run();
