#!/usr/bin/env node
import { readJson, resolveProjectPath, isRecord } from "../validators/validation-utils.ts";

function run(): void {
  const status = readJson(resolveProjectPath("packages/components/src/component-status.json"));
  if (!isRecord(status) || !Array.isArray(status.components) || !isRecord(status.counts)) {
    throw new Error("Invalid component-status.json.");
  }

  console.log("# JFX Modena Component Report");
  console.log("");
  console.log(`Total components: ${status.components.length}`);

  if (isRecord(status.counts.byStatus)) {
    console.log(`Implemented partial: ${String(status.counts.byStatus.implemented_partial ?? 0)}`);
    console.log(`Scaffold only: ${String(status.counts.byStatus.scaffold_only ?? 0)}`);
  }

  console.log("");
  console.log("## Categories");
  if (isRecord(status.counts.byCategory)) {
    for (const [category, count] of Object.entries(status.counts.byCategory).sort(([a], [b]) => a.localeCompare(b))) {
      console.log(`- ${category}: ${String(count)}`);
    }
  }

  console.log("");
  console.log("## Implemented Partial");
  const implemented = status.components.filter((record) => isRecord(record) && record.componentStatus === "implemented_partial");
  if (implemented.length === 0) {
    console.log("- None");
  } else {
    for (const record of implemented) {
      if (isRecord(record)) {
        console.log(`- ${String(record.tagName)}: ${String(record.certificationStatus)}`);
      }
    }
  }
}

run();
