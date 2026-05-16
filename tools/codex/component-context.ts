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

export interface SourceContextMetadata {
  maxSourceChars: number | null;
  fullSources: boolean;
  truncatedSourceCount: number;
  totalSourceChars: number;
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
  sourceContext: SourceContextMetadata;
  sourceExcerpts: SourceExcerpt[];
  recommendedVerificationCommands: string[];
}

export interface CollectOptions {
  maxSourceChars?: number;
  fullSources?: boolean;
}

export function parseCollectOptions(argv: string[], defaultOptions: CollectOptions = {}): CollectOptions {
  const options: CollectOptions = { ...defaultOptions };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];

    if (arg === "--full-sources") {
      options.fullSources = true;
    } else if (arg === "--max-source-chars") {
      const value = argv[index + 1];
      if (!value) {
        throw new Error("--max-source-chars requires a numeric value.");
      }

      const maxSourceChars = Number.parseInt(value, 10);
      if (!Number.isSafeInteger(maxSourceChars) || maxSourceChars < 1) {
        throw new Error(`--max-source-chars must be a positive integer: ${value}`);
      }

      options.maxSourceChars = maxSourceChars;
      if (!argv.includes("--full-sources")) {
        options.fullSources = false;
      }
      index += 1;
    } else if (arg === "--print-prompt") {
      continue;
    } else if (arg === "--output") {
      index += 1;
    }
  }

  return options;
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
  const fullSources = options.fullSources ?? false;
  const maxSourceChars = fullSources ? null : options.maxSourceChars ?? 6000;
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
  let totalSourceChars = 0;
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
    totalSourceChars += content.length;
    const truncated = typeof maxSourceChars === "number" && content.length > maxSourceChars;
    return {
      path: sourcePath,
      exists: true,
      excerpt: truncated ? content.slice(0, maxSourceChars) : content,
      truncated,
    };
  });
  const truncatedSourceCount = sourceExcerpts.filter((source) => source.truncated).length;

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
    sourceContext: {
      maxSourceChars,
      fullSources,
      truncatedSourceCount,
      totalSourceChars,
    },
    sourceExcerpts,
    recommendedVerificationCommands: [
      `npm run --silent codex:component-context -- ${componentTag}`,
      `npm run --silent codex:audit-component -- ${componentTag} --print-prompt`,
      "npm run typecheck:tools",
    ],
  };
}
