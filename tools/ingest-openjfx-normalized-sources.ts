#!/usr/bin/env node
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const openJfxCommit = "277aec13d0879718a9ac2231402e19eed6f70d20";
const normalizer = "jfx_modena_openjfx_ingest@0.1.0";
const sourceRepo = "https://github.com/openjdk/jfx.git";
const sourceName = "OpenJFX Source";
const sourceId = "openjdk-jfx";
const normalizedRoot = "reference-inputs/normalized/openjdk-jfx/git";

type OpenJfxSource = {
  sourcePath: string;
  title: string;
};

type NormalizedSourceOutput = {
  outputPath: string;
  sourcePath: string;
  rawSha256: string;
  markdown: string;
};

const sources: OpenJfxSource[] = [
  {
    sourcePath: "modules/javafx.controls/src/main/java/javafx/scene/control/skin/LabeledSkinBase.java",
    title: "LabeledSkinBase.java",
  },
  {
    sourcePath: "modules/javafx.controls/src/main/java/com/sun/javafx/scene/control/behavior/BehaviorBase.java",
    title: "BehaviorBase.java",
  },
  {
    sourcePath: "modules/javafx.controls/src/main/java/com/sun/javafx/scene/control/skin/Utils.java",
    title: "Utils.java",
  },
  {
    sourcePath: "modules/javafx.controls/src/main/java/javafx/scene/control/Pagination.java",
    title: "Pagination.java",
  },
  {
    sourcePath: "modules/javafx.controls/src/main/java/javafx/scene/control/skin/PaginationSkin.java",
    title: "PaginationSkin.java",
  },
];

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(scriptDir, "..");

function assertExactSourceSet(): void {
  if (sources.length !== 5) {
    throw new Error(`Expected exactly 5 OpenJFX sources, found ${sources.length}.`);
  }

  const uniquePaths = new Set(sources.map((source) => source.sourcePath));
  if (uniquePaths.size !== sources.length) {
    throw new Error("OpenJFX source list must not contain duplicate source paths.");
  }
}

function sha256(text: string): string {
  return crypto.createHash("sha256").update(text).digest("hex");
}

function utcTimestamp(): string {
  return new Date().toISOString().replace("Z", "+00:00");
}

function rawSourceUrl(sourcePath: string): string {
  return `https://raw.githubusercontent.com/openjdk/jfx/${openJfxCommit}/${sourcePath}`;
}

function blobSourceUrl(sourcePath: string): string {
  return `${sourceRepo}/blob/${openJfxCommit}/${sourcePath}`;
}

function quoteYaml(value: string): string {
  return JSON.stringify(value);
}

function readExistingTimestamps(outputPath: string, rawSha256: string): { normalizedAt: string; retrievedAt: string } | null {
  if (!fs.existsSync(outputPath)) {
    return null;
  }

  const markdown = fs.readFileSync(outputPath, "utf8");
  if (!markdown.startsWith("---\n")) {
    return null;
  }

  const frontmatterEnd = markdown.indexOf("\n---", 4);
  if (frontmatterEnd === -1) {
    return null;
  }

  const frontmatter = markdown.slice(4, frontmatterEnd);
  const rawShaMatch = /^raw_sha256:\s*"([^"]+)"$/m.exec(frontmatter);
  const normalizedAtMatch = /^normalized_at:\s*"([^"]+)"$/m.exec(frontmatter);
  const retrievedAtMatch = /^retrieved_at:\s*"([^"]+)"$/m.exec(frontmatter);

  if (
    rawShaMatch?.[1] !== rawSha256 ||
    !normalizedAtMatch?.[1] ||
    !retrievedAtMatch?.[1]
  ) {
    return null;
  }

  return {
    normalizedAt: normalizedAtMatch[1],
    retrievedAt: retrievedAtMatch[1],
  };
}

function makeMarkdown(source: OpenJfxSource, rawContent: string, rawSha256: string, outputPath: string): string {
  const existingTimestamps = readExistingTimestamps(outputPath, rawSha256);
  const timestamp = utcTimestamp();
  const normalizedAt = existingTimestamps?.normalizedAt ?? timestamp;
  const retrievedAt = existingTimestamps?.retrievedAt ?? timestamp;
  const sourcePath = `git/${source.sourcePath}`;

  const frontmatter: Record<string, string> = {
    authority_type: "reference_implementation",
    category: "01-openjfx-source",
    file_type: "code",
    license: "GPL-2.0-only with Classpath Exception",
    normalized_at: normalizedAt,
    normalizer,
    raw_sha256: rawSha256,
    retrieved_at: retrievedAt,
    source_commit: openJfxCommit,
    source_id: sourceId,
    source_name: sourceName,
    source_path: sourcePath,
    source_repo: sourceRepo,
    source_url: blobSourceUrl(source.sourcePath),
    title: source.title,
  };

  const frontmatterText = Object.entries(frontmatter)
    .map(([key, value]) => `${key}: ${quoteYaml(value)}`)
    .join("\n");

  return `---\n${frontmatterText}\n---\n\`\`\`java\n${rawContent.trimEnd()}\n\`\`\`\n`;
}

async function fetchSource(source: OpenJfxSource): Promise<NormalizedSourceOutput> {
  const response = await fetch(rawSourceUrl(source.sourcePath));
  if (!response.ok) {
    throw new Error(`Failed to fetch ${source.sourcePath}: ${response.status} ${response.statusText}`);
  }

  const rawContent = await response.text();
  const rawSha256 = sha256(rawContent);
  const outputPath = path.join(projectRoot, normalizedRoot, `${source.sourcePath}.md`);

  return {
    outputPath,
    sourcePath: source.sourcePath,
    rawSha256,
    markdown: makeMarkdown(source, rawContent, rawSha256, outputPath),
  };
}

function writeOutput(output: NormalizedSourceOutput): void {
  fs.mkdirSync(path.dirname(output.outputPath), { recursive: true });
  fs.writeFileSync(output.outputPath, output.markdown, "utf8");
}

async function run(): Promise<void> {
  assertExactSourceSet();

  const outputs = [];
  for (const source of sources) {
    outputs.push(await fetchSource(source));
  }

  for (const output of outputs) {
    writeOutput(output);
  }

  console.log(JSON.stringify(
    {
      sourceCommit: openJfxCommit,
      normalizer,
      fetchedCount: outputs.length,
      sources: outputs.map((output) => ({
        sourcePath: output.sourcePath,
        normalizedPath: path.relative(projectRoot, output.outputPath),
        rawSha256: output.rawSha256,
      })),
    },
    null,
    2,
  ));
}

run().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
