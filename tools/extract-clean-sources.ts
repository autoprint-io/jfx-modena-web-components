#!/usr/bin/env node
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

type CliArgs = {
  allowlistPath: string;
  clean: boolean;
  dryRun: boolean;
};

type AllowlistEntry = {
  kind: string;
  cleanPath: string;
  normalizedPath: string;
  localPath?: string;
  componentTags?: string[];
};

type Allowlist = {
  version: number;
  description?: string;
  normalizedRoot: string;
  outputRoot: string;
  entries: AllowlistEntry[];
};

type FrontmatterMetadata = Record<string, string | null>;

type FrontmatterParseResult = {
  metadata: FrontmatterMetadata;
  body: string;
};

type SourceIndexRecord = {
  cleanPath: string;
  normalizedPath: string;
  localPath: string | null;
  contentSource: "local-override" | "normalized";
  kind: string;
  componentTags: string[];
  sourceId: string | null;
  sourceName: string | null;
  sourcePath: string | null;
  sourceRepo: string | null;
  sourceUrl: string | null;
  sourceCommit: string | null;
  license: string | null;
  rawSha256: string | null;
  cleanSha256: string;
};

type ComponentSourceMapEntry = {
  kind: string;
  cleanPath: string;
  sourcePath: string | null;
  sourceUrl: string | null;
  sourceCommit: string | null;
  license: string | null;
  cleanSha256: string;
};

type ComponentSourceMap = Record<string, ComponentSourceMapEntry[]>;

type MissingSourceRecord = {
  cleanPath: string;
  normalizedPath: string;
  localPath?: string;
  kind: string;
  componentTags: string[];
};

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(scriptDir, "..");
const defaultAllowlistPath = path.join(projectRoot, "tools", "clean-source-allowlist.json");

function parseArgs(argv: string[]): CliArgs {
  const args: CliArgs = {
    allowlistPath: defaultAllowlistPath,
    clean: false,
    dryRun: false,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--allowlist") {
      args.allowlistPath = path.resolve(projectRoot, argv[index + 1]);
      index += 1;
    } else if (arg === "--clean") {
      args.clean = true;
    } else if (arg === "--dry-run") {
      args.dryRun = true;
    } else if (arg === "--help" || arg === "-h") {
      printHelp();
      process.exit(0);
    } else {
      throw new Error(`Unknown argument: ${arg}`);
    }
  }

  return args;
}

function printHelp(): void {
  console.log(`Usage: node --experimental-strip-types tools/extract-clean-sources.ts [options]

Options:
  --allowlist <path>  Allowlist JSON path, relative to project root.
  --clean             Remove the output root before writing.
  --dry-run           Validate and report without writing files.
  --help              Show this help.
`);
}

function readJson<T>(filePath: string): T {
  return JSON.parse(fs.readFileSync(filePath, "utf8")) as T;
}

function ensureInsideProject(relativePath: string, label: string): string {
  if (path.isAbsolute(relativePath)) {
    throw new Error(`${label} must be relative: ${relativePath}`);
  }

  const normalized = path.normalize(relativePath);
  if (normalized.startsWith("..") || path.isAbsolute(normalized)) {
    throw new Error(`${label} must stay inside its root: ${relativePath}`);
  }

  return normalized;
}

function parseFrontmatter(markdown: string): FrontmatterParseResult {
  if (!markdown.startsWith("---\n")) {
    return { metadata: {}, body: markdown };
  }

  const end = markdown.indexOf("\n---", 4);
  if (end === -1) {
    return { metadata: {}, body: markdown };
  }

  const frontmatter = markdown.slice(4, end);
  const bodyStart = markdown.indexOf("\n", end + 4);
  const body = bodyStart === -1 ? "" : markdown.slice(bodyStart + 1);
  const metadata: FrontmatterMetadata = {};

  for (const line of frontmatter.split("\n")) {
    const match = /^([A-Za-z0-9_-]+):\s*(.*)$/.exec(line);
    if (!match) continue;

    const key = match[1];
    let value = match[2].trim();
    if (value === "null") {
      metadata[key] = null;
    } else if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      metadata[key] = value.slice(1, -1);
    } else {
      metadata[key] = value;
    }
  }

  return { metadata, body };
}

function stripSingleCodeFence(body: string): string {
  const trimmedStart = body.replace(/^\s+/, "");
  const fenceMatch = /^```[A-Za-z0-9_-]*\n/.exec(trimmedStart);
  if (!fenceMatch) {
    return body.trimEnd() + "\n";
  }

  const afterOpeningFence = trimmedStart.slice(fenceMatch[0].length);
  const closingFenceIndex = afterOpeningFence.lastIndexOf("\n```");
  if (closingFenceIndex === -1) {
    return body.trimEnd() + "\n";
  }

  return afterOpeningFence.slice(0, closingFenceIndex).trimEnd() + "\n";
}

function stripLeadingXmlComments(content: string): string {
  return content.replace(
    /^(<\?xml[^>]*\?>\n)(?:\s*<!--[\s\S]*?-->\n)+/,
    "$1",
  );
}

function stripLeadingBlockComments(content: string): string {
  return content.replace(/^(?:\s*\/\*[\s\S]*?\*\/\n)+/, "").replace(/^\s+/, "");
}

function sha256(text: string): string {
  return crypto.createHash("sha256").update(text).digest("hex");
}

function writeFile(filePath: string, text: string): void {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, text, "utf8");
}

function makeSourceIndexRecord(
  entry: AllowlistEntry,
  metadata: FrontmatterMetadata,
  cleanContent: string,
): SourceIndexRecord {
  return {
    cleanPath: entry.cleanPath,
    normalizedPath: entry.normalizedPath,
    localPath: entry.localPath ?? null,
    contentSource: entry.localPath ? "local-override" : "normalized",
    kind: entry.kind,
    componentTags: entry.componentTags ?? [],
    sourceId: metadata.source_id ?? null,
    sourceName: metadata.source_name ?? null,
    sourcePath: metadata.source_path ?? null,
    sourceRepo: metadata.source_repo ?? null,
    sourceUrl: metadata.source_url ?? null,
    sourceCommit: metadata.source_commit ?? null,
    license: metadata.license ?? null,
    rawSha256: metadata.raw_sha256 ?? null,
    cleanSha256: sha256(cleanContent),
  };
}

function addToComponentSourceMap(componentMap: ComponentSourceMap, record: SourceIndexRecord): void {
  for (const tag of record.componentTags) {
    if (!componentMap[tag]) {
      componentMap[tag] = [];
    }

    componentMap[tag].push({
      kind: record.kind,
      cleanPath: record.cleanPath,
      sourcePath: record.sourcePath,
      sourceUrl: record.sourceUrl,
      sourceCommit: record.sourceCommit,
      license: record.license,
      cleanSha256: record.cleanSha256,
    });
  }
}

function run(): void {
  const args = parseArgs(process.argv.slice(2));
  const allowlist = readJson<Allowlist>(args.allowlistPath);
  const normalizedRoot = path.resolve(projectRoot, allowlist.normalizedRoot);
  const outputRoot = path.resolve(projectRoot, ensureInsideProject(allowlist.outputRoot, "outputRoot"));
  const manifestsRoot = path.join(outputRoot, "manifests");

  if (!Array.isArray(allowlist.entries)) {
    throw new Error("Allowlist must contain an entries array.");
  }

  const sourceIndex: SourceIndexRecord[] = [];
  const componentSourceMap: ComponentSourceMap = {};
  const missingSources: MissingSourceRecord[] = [];

  if (args.clean && !args.dryRun) {
    fs.rmSync(outputRoot, { recursive: true, force: true });
  }

  for (const entry of allowlist.entries) {
    ensureInsideProject(entry.normalizedPath, "normalizedPath");
    ensureInsideProject(entry.cleanPath, "cleanPath");

    const normalizedPath = path.join(normalizedRoot, entry.normalizedPath);
    const cleanPath = path.join(outputRoot, entry.cleanPath);

    if (!fs.existsSync(normalizedPath)) {
      missingSources.push({
        cleanPath: entry.cleanPath,
        normalizedPath: entry.normalizedPath,
        kind: entry.kind,
        componentTags: entry.componentTags ?? [],
      });
      continue;
    }

    const normalizedMarkdown = fs.readFileSync(normalizedPath, "utf8");
    const { metadata, body } = parseFrontmatter(normalizedMarkdown);
    let cleanContent = stripSingleCodeFence(body);

    if (entry.localPath) {
      const localPath = path.resolve(projectRoot, entry.localPath);
      if (!fs.existsSync(localPath)) {
        missingSources.push({
          cleanPath: entry.cleanPath,
          normalizedPath: entry.normalizedPath,
          localPath: entry.localPath,
          kind: entry.kind,
          componentTags: entry.componentTags ?? [],
        });
        continue;
      }

      cleanContent = fs.readFileSync(localPath, "utf8").trimEnd() + "\n";
    }

    if (entry.kind === "fixture-source" && entry.cleanPath.endsWith(".fxml")) {
      cleanContent = stripLeadingXmlComments(cleanContent).trimEnd() + "\n";
    }

    if (
      (
        entry.kind === "common-source" ||
        entry.kind === "control-source" ||
        entry.kind === "scenebuilder-metadata" ||
        entry.kind === "skin-source"
      ) &&
      entry.cleanPath.endsWith(".java")
    ) {
      cleanContent = stripLeadingBlockComments(cleanContent).trimEnd() + "\n";
    }

    const record = makeSourceIndexRecord(entry, metadata, cleanContent);

    sourceIndex.push(record);
    addToComponentSourceMap(componentSourceMap, record);

    if (!args.dryRun) {
      writeFile(cleanPath, cleanContent);
    }
  }

  const manifest = {
    generatedAt: new Date().toISOString(),
    allowlistPath: path.relative(projectRoot, args.allowlistPath),
    normalizedRoot: allowlist.normalizedRoot,
    outputRoot: allowlist.outputRoot,
    sourceCount: sourceIndex.length,
    missingCount: missingSources.length,
  };

  if (!args.dryRun) {
    writeFile(path.join(manifestsRoot, "source-index.json"), JSON.stringify({ ...manifest, sources: sourceIndex }, null, 2) + "\n");
    writeFile(path.join(manifestsRoot, "component-source-map.json"), JSON.stringify({ ...manifest, components: componentSourceMap }, null, 2) + "\n");
    writeFile(path.join(manifestsRoot, "missing-sources.json"), JSON.stringify({ ...manifest, missingSources }, null, 2) + "\n");
  }

  console.log(`Clean sources: ${sourceIndex.length}`);
  console.log(`Missing sources: ${missingSources.length}`);
  console.log(`Output root: ${path.relative(projectRoot, outputRoot)}`);

  if (missingSources.length > 0) {
    for (const missing of missingSources) {
      console.error(`Missing: ${missing.normalizedPath}`);
    }
    process.exitCode = 1;
  }
}

run();
