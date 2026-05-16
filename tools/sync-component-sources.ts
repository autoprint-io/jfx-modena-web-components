#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

const scriptDir = path.dirname(new URL(import.meta.url).pathname);
const projectRoot = path.resolve(scriptDir, "..");
const componentStatusPath = path.join(projectRoot, "packages/components/src/component-status.json");
const componentSourceMapPath = path.join(projectRoot, "reference-sources/manifests/component-source-map.json");
const sharedModenaSource = "reference-sources/openjfx/modena/modena.css";

type ComponentRecord = {
  tagName: string;
  category: string;
  componentStatus: string;
  files: {
    sources: string | null;
  };
  sourceCount: number;
};

type ComponentSourceMapEntry = {
  kind: string;
  cleanPath: string;
};

type ComponentStatusFile = {
  components: ComponentRecord[];
};

type ComponentSourceMapFile = {
  components: Record<string, ComponentSourceMapEntry[]>;
};

type Args = {
  component: string | null;
  category: string | null;
  status: string | null;
  limit: number | null;
  all: boolean;
  write: boolean;
};

type ProposedComponent = {
  tagName: string;
  category: string;
  componentStatus: string;
  sourcesFile: string | null;
  currentSourceCount: number;
  proposedSourceCount: number;
  currentSources: string[];
  proposedSources: string[];
};

type SkippedComponent = {
  tagName: string;
  reason: string;
  sourcesFile: string | null;
  currentSources: string[];
  proposedSources: string[];
};

type MissingSourcePath = {
  tagName: string;
  cleanPath: string;
  resolvedPath: string;
};

function parseArgs(argv: string[]): Args {
  const args: Args = {
    component: null,
    category: null,
    status: null,
    limit: null,
    all: false,
    write: false,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];

    if (arg === "--") {
      continue;
    } else if (arg === "--all") {
      args.all = true;
    } else if (arg === "--component") {
      args.component = argv[index + 1] ?? null;
      index += 1;
    } else if (arg === "--category") {
      args.category = argv[index + 1] ?? null;
      index += 1;
    } else if (arg === "--status") {
      args.status = argv[index + 1] ?? null;
      index += 1;
    } else if (arg === "--limit") {
      const value = Number.parseInt(argv[index + 1] ?? "", 10);
      if (!Number.isSafeInteger(value) || value < 1) {
        throw new Error(`--limit must be a positive integer: ${argv[index + 1] ?? ""}`);
      }
      args.limit = value;
      index += 1;
    } else if (arg === "--dry-run") {
      args.write = false;
    } else if (arg === "--write") {
      args.write = true;
    } else {
      throw new Error(`Unknown argument: ${arg}`);
    }
  }

  return args;
}

function usage(): string {
  return [
    "Usage: npm run sync:component-sources -- [--component tagName | --category category | --status status | --all] [--limit n] [--dry-run | --write]",
    "Selection is required. Use --all explicitly for full-repo sync planning or writing.",
  ].join("\n");
}

function hasSelector(args: Args): boolean {
  return args.all || args.component !== null || args.category !== null || args.status !== null;
}

function readJson<T>(filePath: string): T {
  return JSON.parse(fs.readFileSync(filePath, "utf8")) as T;
}

function sourcePathFromCleanPath(cleanPath: string): string {
  return `reference-sources/${cleanPath}`;
}

function sourceExists(sourcePath: string): boolean {
  return fs.existsSync(path.join(projectRoot, sourcePath));
}

function isSharedSource(sourcePath: string): boolean {
  return sourcePath === sharedModenaSource;
}

function readExistingSources(sourcesPath: string | null): string[] {
  if (!sourcesPath) {
    return [];
  }

  const absoluteSourcesPath = path.join(projectRoot, sourcesPath);
  if (!fs.existsSync(absoluteSourcesPath)) {
    return [];
  }

  const sourcesFile = readJson<unknown>(absoluteSourcesPath);
  if (
    typeof sourcesFile !== "object" ||
    sourcesFile === null ||
    !("sources" in sourcesFile) ||
    !Array.isArray(sourcesFile.sources)
  ) {
    return [];
  }

  return sourcesFile.sources.filter((sourcePath): sourcePath is string => typeof sourcePath === "string");
}

function sourceKindPriority(sourcePath: string, kindBySourcePath: Map<string, string>): number {
  const kind = kindBySourcePath.get(sourcePath);

  if (sourcePath === sharedModenaSource || kind === "modena-css") {
    return 0;
  }

  switch (kind) {
    case "control-source":
      return 10;
    case "common-source":
    case "inherited-control-source":
      return 20;
    case "skin-source":
    case "inherited-skin-source":
      return 30;
    case "behavior-source":
      return 40;
    case "fixture-source":
    case "scene-builder-fixture":
      return 50;
    case "docs":
    case "javafx-css-reference":
      return 60;
    default:
      return 90;
  }
}

function sortSources(sources: string[], kindBySourcePath: Map<string, string>): string[] {
  return [...new Set(sources)].sort((left, right) => {
    const priorityDelta = sourceKindPriority(left, kindBySourcePath) - sourceKindPriority(right, kindBySourcePath);
    if (priorityDelta !== 0) {
      return priorityDelta;
    }

    return left.localeCompare(right);
  });
}

function arraysEqual(left: string[], right: string[]): boolean {
  return left.length === right.length && left.every((value, index) => value === right[index]);
}

function selectComponents(components: ComponentRecord[], args: Args): ComponentRecord[] {
  let selected = components;

  if (args.component) {
    selected = selected.filter((component) => component.tagName === args.component);
  }

  if (args.category) {
    selected = selected.filter((component) => component.category === args.category);
  }

  if (args.status) {
    selected = selected.filter((component) => component.componentStatus === args.status);
  }

  if (args.limit !== null) {
    selected = selected.slice(0, args.limit);
  }

  return selected;
}

function writeSourcesFile(component: ProposedComponent): void {
  if (!component.sourcesFile) {
    return;
  }

  const output = {
    tagName: component.tagName,
    sources: component.proposedSources,
  };

  fs.writeFileSync(path.join(projectRoot, component.sourcesFile), `${JSON.stringify(output, null, 2)}\n`, "utf8");
}

function writeEmptySourcesFile(sourcesPath: string): void {
  fs.writeFileSync(path.join(projectRoot, sourcesPath), "{}\n", "utf8");
}

function run(): void {
  const args = parseArgs(process.argv.slice(2));
  if (!hasSelector(args)) {
    console.error("Error: select components with --component, --category, --status, or --all.");
    console.error(usage());
    process.exit(1);
  }

  const status = readJson<ComponentStatusFile>(componentStatusPath);
  const sourceMap = readJson<ComponentSourceMapFile>(componentSourceMapPath);
  const selected = selectComponents(status.components, args);
  const proposedComponents: ProposedComponent[] = [];
  const skippedComponents: SkippedComponent[] = [];
  const unresolvedMissingSourcePaths: MissingSourcePath[] = [];
  const writtenFiles: string[] = [];
  const revertedFiles: string[] = [];

  for (const component of selected) {
    if (!component.files.sources) {
      skippedComponents.push({
        tagName: component.tagName,
        reason: "Component has no sources file in component-status.json.",
        sourcesFile: null,
        currentSources: [],
        proposedSources: [],
      });
      continue;
    }

    const kindBySourcePath = new Map<string, string>();
    const mappedSources = (sourceMap.components[component.tagName] ?? []).flatMap((entry) => {
      const sourcePath = sourcePathFromCleanPath(entry.cleanPath);
      kindBySourcePath.set(sourcePath, entry.kind);

      if (!sourceExists(sourcePath)) {
        unresolvedMissingSourcePaths.push({
          tagName: component.tagName,
          cleanPath: entry.cleanPath,
          resolvedPath: sourcePath,
        });
        return [];
      }

      return [sourcePath];
    });

    const currentSources = readExistingSources(component.files.sources);
    const existingSources = currentSources.filter((sourcePath) => {
      if (sourceExists(sourcePath)) {
        return true;
      }

      unresolvedMissingSourcePaths.push({
        tagName: component.tagName,
        cleanPath: sourcePath.replace(/^reference-sources\//, ""),
        resolvedPath: sourcePath,
      });
      return false;
    });
    const existingComponentSpecificSources = existingSources.filter((sourcePath) => !isSharedSource(sourcePath));
    const mappedComponentSpecificSources = mappedSources.filter((sourcePath) => !isSharedSource(sourcePath));
    const shouldAddSharedModenaSource =
      component.category === "controls" &&
      sourceExists(sharedModenaSource) &&
      (existingComponentSpecificSources.length > 0 || mappedComponentSpecificSources.length > 0);
    const sharedSources = shouldAddSharedModenaSource ? [sharedModenaSource] : [];
    if (shouldAddSharedModenaSource) {
      kindBySourcePath.set(sharedModenaSource, "modena-css");
    }
    const proposedSources = sortSources(
      [...existingComponentSpecificSources, ...sharedSources, ...mappedComponentSpecificSources],
      kindBySourcePath,
    );

    if (proposedSources.length === 0) {
      skippedComponents.push({
        tagName: component.tagName,
        reason: existingSources.some(isSharedSource)
          ? "Only shared sources available; no component-specific clean source authority mapped."
          : "No existing clean source authority mapped for this component.",
        sourcesFile: component.files.sources,
        currentSources,
        proposedSources,
      });
      if (args.write && currentSources.length > 0) {
        writeEmptySourcesFile(component.files.sources);
        revertedFiles.push(component.files.sources);
      }
      continue;
    }

    const proposedComponent: ProposedComponent = {
      tagName: component.tagName,
      category: component.category,
      componentStatus: component.componentStatus,
      sourcesFile: component.files.sources,
      currentSourceCount: component.sourceCount,
      proposedSourceCount: proposedSources.length,
      currentSources,
      proposedSources,
    };
    proposedComponents.push(proposedComponent);

    if (args.write && !arraysEqual(currentSources, proposedSources)) {
      writeSourcesFile(proposedComponent);
      writtenFiles.push(component.files.sources);
    }
  }

  console.log(JSON.stringify(
    {
      mode: args.write ? "write" : "dry-run",
      selectedComponents: proposedComponents.map((component) => ({
        tagName: component.tagName,
        category: component.category,
        componentStatus: component.componentStatus,
      })),
      currentSourceCounts: Object.fromEntries(
        proposedComponents.map((component) => [component.tagName, component.currentSourceCount]),
      ),
      proposedSourceCounts: Object.fromEntries(
        proposedComponents.map((component) => [component.tagName, component.proposedSourceCount]),
      ),
      proposedSources: Object.fromEntries(
        proposedComponents.map((component) => [component.tagName, component.proposedSources]),
      ),
      writtenFiles,
      revertedFiles,
      skippedComponents,
      unresolvedMissingSourcePaths,
      conventions: {
        sharedModenaCssForControls:
          "Components in category `controls` receive reference-sources/openjfx/modena/modena.css only when at least one component-specific clean source exists or is already declared.",
        docs:
          "JavaFX CSS docs are not added globally because component sources files do not currently use that convention.",
      },
    },
    null,
    2,
  ));
}

run();
