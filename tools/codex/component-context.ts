import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { buildComponentProfile } from "./component-profile.ts";
import type { ComponentProfile } from "./component-profile.ts";

const currentFile = fileURLToPath(import.meta.url);
const toolsRoot = path.resolve(path.dirname(currentFile), "..");
export const projectRoot = path.resolve(toolsRoot, "..");

export interface SourceExcerpt {
  path: string;
  exists: boolean;
  excerpt: string;
  truncated: boolean;
}

export interface ComponentFilePaths {
  component: string | null;
  template: string | null;
  styles: string | null;
  manifest: string | null;
  sources: string | null;
  unitTest: string | null;
  accessibilityTest: string | null;
}

export interface ComponentCodexContext {
  component: string;
  profile: ComponentProfile;
  statusRecord: unknown;
  manifest: unknown;
  sources: unknown;
  filePaths: ComponentFilePaths;
  implementation: string | null;
  template: string | null;
  styles: string | null;
  unitTest: string | null;
  accessibilityTest: string | null;
  sourceExcerpts: SourceExcerpt[];
  recommendedVerificationCommands: string[];
}

interface CollectOptions {
  maxSourceChars?: number;
}

function readJson(projectPath: string): unknown {
  return JSON.parse(fs.readFileSync(path.join(projectRoot, projectPath), "utf8"));
}

function readText(projectPath: string | null, maxChars?: number): string | null {
  if (!projectPath) {
    return null;
  }

  const absolutePath = path.join(projectRoot, projectPath);
  if (!fs.existsSync(absolutePath)) {
    return null;
  }

  const content = fs.readFileSync(absolutePath, "utf8");
  return typeof maxChars === "number" ? content.slice(0, maxChars) : content;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function sourceList(value: unknown): string[] {
  if (!isRecord(value) || !Array.isArray(value.sources)) {
    return [];
  }

  return value.sources.filter((item): item is string => typeof item === "string");
}

export function collectComponentContext(componentTag: string, options: CollectOptions = {}): ComponentCodexContext {
  const maxSourceChars = options.maxSourceChars ?? 6000;
  const status = readJson("packages/components/src/component-status.json");

  if (!isRecord(status) || !Array.isArray(status.components)) {
    throw new Error("Invalid component-status.json shape.");
  }

  const statusRecord = status.components.find((record) => {
    return isRecord(record) && record.tagName === componentTag;
  });

  if (!isRecord(statusRecord)) {
    throw new Error(`Component not found in component-status.json: ${componentTag}`);
  }

  const files = isRecord(statusRecord.files) ? statusRecord.files : {};
  const manifestPath = typeof files.manifest === "string" ? files.manifest : null;
  const sourcesPath = typeof files.sources === "string" ? files.sources : null;
  const filePaths: ComponentFilePaths = {
    component: typeof files.component === "string" ? files.component : null,
    template: typeof files.template === "string" ? files.template : null,
    styles: typeof files.styles === "string" ? files.styles : null,
    manifest: manifestPath,
    sources: sourcesPath,
    unitTest: typeof files.unitTest === "string" ? files.unitTest : null,
    accessibilityTest: typeof files.accessibilityTest === "string" ? files.accessibilityTest : null,
  };

  if (!manifestPath) {
    throw new Error(`Component record has no manifest path: ${componentTag}`);
  }

  const manifest = readJson(manifestPath);
  const sources = sourcesPath ? readJson(sourcesPath) : {};
  const sourceExcerpts = sourceList(sources).map((sourcePath) => {
    const absoluteSourcePath = path.join(projectRoot, sourcePath);
    if (!fs.existsSync(absoluteSourcePath)) {
      return {
        path: sourcePath,
        exists: false,
        excerpt: "",
        truncated: false,
      };
    }

    const content = fs.readFileSync(absoluteSourcePath, "utf8");
    return {
      path: sourcePath,
      exists: true,
      excerpt: content.slice(0, maxSourceChars),
      truncated: content.length > maxSourceChars,
    };
  });

  return {
    component: componentTag,
    profile: buildComponentProfile(statusRecord, sources),
    statusRecord,
    manifest,
    sources,
    filePaths,
    implementation: readText(filePaths.component),
    template: readText(filePaths.template),
    styles: readText(filePaths.styles),
    unitTest: readText(filePaths.unitTest),
    accessibilityTest: readText(filePaths.accessibilityTest),
    sourceExcerpts,
    recommendedVerificationCommands: [
      `npm run --silent codex:component-context -- ${componentTag}`,
      `npm run --silent codex:audit-component -- ${componentTag} --print-prompt`,
      "npm run typecheck:tools",
    ],
  };
}
