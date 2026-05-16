#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import {
  classifyComponentSource,
  componentsRoot,
  isEmptyRecord,
  isRecord,
  isStringArray,
  projectRoot,
  readJson,
  relativePath,
  resolveProjectPath,
  ValidationReporter,
  walkFiles,
} from "./validation-utils.ts";

const tagPattern = /^jfx-[a-z0-9]+(?:-[a-z0-9]+)*$/;
const sourceRoot = resolveProjectPath("reference-sources");

function isInsideSourceRoot(sourcePath: string): boolean {
  const absoluteSourcePath = resolveProjectPath(sourcePath);
  const relativeToSourceRoot = path.relative(sourceRoot, absoluteSourcePath);
  return relativeToSourceRoot !== "" && !relativeToSourceRoot.startsWith("..") && !path.isAbsolute(relativeToSourceRoot);
}

function run(): void {
  const reporter = new ValidationReporter();
  const sourceFiles = walkFiles(componentsRoot)
    .filter((filePath) => filePath.endsWith(".sources.json"))
    .sort();

  let fullCount = 0;
  let scaffoldCount = 0;
  let referencedSourceCount = 0;

  for (const sourcesPath of sourceFiles) {
    const sources = readJson(sourcesPath);
    const componentPath = sourcesPath.replace(".sources.json", ".ts");
    const derivedStatus = classifyComponentSource(componentPath);
    const displayPath = relativePath(sourcesPath);

    if (!isRecord(sources)) {
      reporter.error(displayPath, "Sources file must be a JSON object.");
      continue;
    }

    if (isEmptyRecord(sources)) {
      scaffoldCount += 1;
      if (derivedStatus !== "scaffold_only") {
        reporter.error(displayPath, "Implemented components must not use an empty sources file.");
      }
      continue;
    }

    fullCount += 1;

    if (typeof sources.tagName !== "string" || !tagPattern.test(sources.tagName)) {
      reporter.error(displayPath, "`tagName` must be a valid jfx-* tag name.");
    }

    const expectedTag = path.basename(sourcesPath, ".sources.json");
    if (typeof sources.tagName === "string" && sources.tagName !== expectedTag) {
      reporter.error(displayPath, `tagName must match file basename \`${expectedTag}\`.`);
    }

    if (!isStringArray(sources.sources) || sources.sources.length === 0) {
      reporter.error(displayPath, "`sources` must be a non-empty array of source paths.");
      continue;
    }

    const uniqueSources = new Set(sources.sources);
    if (uniqueSources.size !== sources.sources.length) {
      reporter.error(displayPath, "`sources` must not contain duplicates.");
    }

    for (const sourcePath of sources.sources) {
      referencedSourceCount += 1;

      if (path.isAbsolute(sourcePath)) {
        reporter.error(displayPath, `Source path must be project-relative: ${sourcePath}`);
        continue;
      }

      if (sourcePath.includes("..")) {
        reporter.error(displayPath, `Source path must not contain parent traversal: ${sourcePath}`);
        continue;
      }

      if (!sourcePath.startsWith("reference-sources/")) {
        reporter.error(displayPath, `Source path must start with reference-sources/: ${sourcePath}`);
        continue;
      }

      if (!isInsideSourceRoot(sourcePath)) {
        reporter.error(displayPath, `Source path resolves outside reference-sources/: ${sourcePath}`);
        continue;
      }

      const absoluteSourcePath = path.resolve(projectRoot, sourcePath);
      if (!fs.existsSync(absoluteSourcePath)) {
        reporter.error(displayPath, `Referenced source does not exist: ${sourcePath}`);
      }
    }
  }

  console.log(`Component source maps: ${sourceFiles.length}`);
  console.log(`Full source maps: ${fullCount}`);
  console.log(`Scaffold source maps: ${scaffoldCount}`);
  console.log(`Referenced sources: ${referencedSourceCount}`);
  reporter.finish("Source traceability validation");
}

run();
