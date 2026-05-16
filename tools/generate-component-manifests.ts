#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

const scriptDir = path.dirname(new URL(import.meta.url).pathname);
const projectRoot = path.resolve(scriptDir, "..");
const componentsRoot = path.join(projectRoot, "packages", "components", "src");
const outputPath = path.join(componentsRoot, "component-status.json");

type ComponentStatus = "implemented_partial" | "scaffold_only";
type CertificationStatus =
  | "not_certified_behavior_visual_a11y_incomplete"
  | "missing_implementation";

interface ComponentRecord {
  tagName: string;
  category: string;
  directory: string;
  componentStatus: ComponentStatus;
  certificationStatus: CertificationStatus;
  files: {
    component: string | null;
    template: string | null;
    styles: string | null;
    manifest: string;
    sources: string | null;
    unitTest: string | null;
    accessibilityTest: string | null;
  };
  sourceCount: number;
}

function walk(dir: string): string[] {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const files: string[] = [];

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...walk(fullPath));
    } else {
      files.push(fullPath);
    }
  }

  return files;
}

function readJson(filePath: string): Record<string, unknown> {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function relative(filePath: string | null): string | null {
  return filePath ? path.relative(projectRoot, filePath) : null;
}

function fileIfExists(filePath: string): string | null {
  return fs.existsSync(filePath) ? filePath : null;
}

function classify(componentPath: string | null): ComponentStatus {
  if (!componentPath) {
    return "scaffold_only";
  }

  const source = fs.readFileSync(componentPath, "utf8");
  if (source.includes("customElements.define(") && source.includes("export class ")) {
    return "implemented_partial";
  }

  return "scaffold_only";
}

function sourceCount(sourcesPath: string | null): number {
  if (!sourcesPath) {
    return 0;
  }

  const sources = readJson(sourcesPath).sources;
  return Array.isArray(sources) ? sources.length : 0;
}

function makeRecord(manifestPath: string): ComponentRecord {
  const dir = path.dirname(manifestPath);
  const base = path.basename(manifestPath, ".manifest.json");
  const parts = path.relative(componentsRoot, dir).split(path.sep);
  const category = parts[0] ?? "unknown";
  const manifest = readJson(manifestPath);
  const componentPath = fileIfExists(path.join(dir, `${base}.ts`));
  const sourcesPath = fileIfExists(path.join(dir, `${base}.sources.json`));
  const componentStatus = classify(componentPath);

  return {
    tagName: String(manifest.tagName ?? base),
    category,
    directory: path.relative(projectRoot, dir),
    componentStatus,
    certificationStatus:
      componentStatus === "implemented_partial"
        ? "not_certified_behavior_visual_a11y_incomplete"
        : "missing_implementation",
    files: {
      component: relative(componentPath),
      template: relative(fileIfExists(path.join(dir, `${base}.template.ts`))),
      styles: relative(fileIfExists(path.join(dir, `${base}.styles.css`))),
      manifest: relative(manifestPath) ?? path.relative(projectRoot, manifestPath),
      sources: relative(sourcesPath),
      unitTest: relative(fileIfExists(path.join(dir, `${base}.test.ts`))),
      accessibilityTest: relative(fileIfExists(path.join(dir, `${base}.a11y.test.ts`))),
    },
    sourceCount: sourceCount(sourcesPath),
  };
}

function run(): void {
  const manifests = walk(componentsRoot)
    .filter((filePath) => filePath.endsWith(".manifest.json"))
    .sort();

  const components = manifests.map(makeRecord).sort((a, b) => {
    return a.tagName.localeCompare(b.tagName);
  });

  const counts = components.reduce(
    (accumulator, component) => {
      accumulator.total += 1;
      accumulator.byStatus[component.componentStatus] += 1;
      accumulator.byCategory[component.category] = (accumulator.byCategory[component.category] ?? 0) + 1;
      return accumulator;
    },
    {
      total: 0,
      byStatus: {
        implemented_partial: 0,
        scaffold_only: 0,
      },
      byCategory: {} as Record<string, number>,
    },
  );

  const output = {
    version: 1,
    description: "Generated component implementation and certification status inventory.",
    counts,
    components,
  };

  fs.writeFileSync(outputPath, `${JSON.stringify(output, null, 2)}\n`, "utf8");

  console.log(`Components: ${counts.total}`);
  console.log(`Implemented partial: ${counts.byStatus.implemented_partial}`);
  console.log(`Scaffold only: ${counts.byStatus.scaffold_only}`);
  console.log(`Wrote: ${path.relative(projectRoot, outputPath)}`);
}

run();
