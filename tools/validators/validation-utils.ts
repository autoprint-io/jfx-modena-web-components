import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const currentFile = fileURLToPath(import.meta.url);
const toolsRoot = path.resolve(path.dirname(currentFile), "..");
export const projectRoot = path.resolve(toolsRoot, "..");
export const componentsRoot = path.join(projectRoot, "packages", "components", "src");

export type ComponentStatus = "implemented_partial" | "scaffold_only";

export interface ComponentFiles {
  component: string | null;
  template: string | null;
  styles: string | null;
  manifest: string;
  sources: string | null;
  unitTest: string | null;
  accessibilityTest: string | null;
}

export interface ComponentStatusRecord {
  tagName: string;
  category: string;
  directory: string;
  componentStatus: ComponentStatus;
  certificationStatus: string;
  files: ComponentFiles;
  sourceCount: number;
}

export function walkFiles(dir: string): string[] {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const files: string[] = [];

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...walkFiles(fullPath));
    } else {
      files.push(fullPath);
    }
  }

  return files;
}

export function readJson(filePath: string): unknown {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function isEmptyRecord(value: unknown): boolean {
  return isRecord(value) && Object.keys(value).length === 0;
}

export function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === "string");
}

export function relativePath(filePath: string): string {
  return path.relative(projectRoot, filePath);
}

export function resolveProjectPath(projectPath: string): string {
  return path.resolve(projectRoot, projectPath);
}

export function componentBaseFromManifestPath(manifestPath: string): string {
  return path.basename(manifestPath, ".manifest.json");
}

export function componentTagFromPath(filePath: string): string {
  return path.basename(filePath).replace(/\.(manifest|sources)\.json$/, "");
}

export function classifyComponentSource(componentPath: string | null): ComponentStatus {
  if (!componentPath || !fs.existsSync(componentPath)) {
    return "scaffold_only";
  }

  const source = fs.readFileSync(componentPath, "utf8");
  if (source.includes("customElements.define(") && source.includes("export class ")) {
    return "implemented_partial";
  }

  return "scaffold_only";
}

export function expectedComponentFiles(manifestPath: string): ComponentFiles {
  const dir = path.dirname(manifestPath);
  const base = componentBaseFromManifestPath(manifestPath);
  const maybe = (suffix: string): string | null => {
    const candidate = path.join(dir, `${base}${suffix}`);
    return fs.existsSync(candidate) ? relativePath(candidate) : null;
  };

  return {
    component: maybe(".ts"),
    template: maybe(".template.ts"),
    styles: maybe(".styles.css"),
    manifest: relativePath(manifestPath),
    sources: maybe(".sources.json"),
    unitTest: maybe(".test.ts"),
    accessibilityTest: maybe(".a11y.test.ts"),
  };
}

export class ValidationReporter {
  readonly errors: string[] = [];
  readonly warnings: string[] = [];

  error(filePath: string, message: string): void {
    this.errors.push(`${filePath}: ${message}`);
  }

  warning(filePath: string, message: string): void {
    this.warnings.push(`${filePath}: ${message}`);
  }

  print(label: string): void {
    console.log(`${label}: ${this.errors.length} error(s), ${this.warnings.length} warning(s)`);

    for (const warning of this.warnings) {
      console.warn(`WARN ${warning}`);
    }

    for (const error of this.errors) {
      console.error(`ERROR ${error}`);
    }
  }

  finish(label: string): void {
    this.print(label);
    if (this.errors.length > 0) {
      process.exitCode = 1;
    }
  }
}
