#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { runnerOutputSchemaPaths } from "./codex-stages.ts";

type Finding = {
  schemaPath: string;
  keyword: string;
  location: string;
};

const currentFile = fileURLToPath(import.meta.url);
const projectRoot = path.resolve(path.dirname(currentFile), "..", "..");

const unsupportedKeywords = ["uniqueItems"];

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function collectUnsupportedKeywords(
  value: unknown,
  schemaPath: string,
  location: string,
  findings: Finding[],
): void {
  if (Array.isArray(value)) {
    value.forEach((item, index) => {
      collectUnsupportedKeywords(item, schemaPath, `${location}[${index}]`, findings);
    });
    return;
  }

  if (!isRecord(value)) {
    return;
  }

  for (const [key, nestedValue] of Object.entries(value)) {
    const nestedLocation = location === "$" ? `$.${key}` : `${location}.${key}`;
    if (unsupportedKeywords.includes(key)) {
      findings.push({
        schemaPath,
        keyword: key,
        location: nestedLocation,
      });
    }

    collectUnsupportedKeywords(nestedValue, schemaPath, nestedLocation, findings);
  }
}

const findings: Finding[] = [];

for (const schemaPath of runnerOutputSchemaPaths) {
  const absolutePath = path.join(projectRoot, schemaPath);
  const schema = JSON.parse(fs.readFileSync(absolutePath, "utf8")) as unknown;
  collectUnsupportedKeywords(schema, schemaPath, "$", findings);
}

if (findings.length > 0) {
  console.error("Codex output schema compatibility check failed.");
  for (const finding of findings) {
    console.error(`- ${finding.schemaPath}: unsupported keyword "${finding.keyword}" at ${finding.location}`);
  }
  process.exit(1);
}

console.log(`Codex output schemas compatible: ${runnerOutputSchemaPaths.length}`);
