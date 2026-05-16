#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

const scriptDir = path.dirname(new URL(import.meta.url).pathname);
const projectRoot = path.resolve(scriptDir, "..");
const tokensRoot = path.join(projectRoot, "packages", "design-system", "src", "tokens");
const sourceRoot = path.join(tokensRoot, "source");
const themesRoot = path.join(tokensRoot, "themes");
const generatedCssPath = path.join(tokensRoot, "generated", "modena.css");
const outputPath = path.join(tokensRoot, "derived", "modena.derived.tokens.json");

function readJson(filePath: string): unknown {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function listJsonFiles(dir: string): string[] {
  return fs
    .readdirSync(dir)
    .filter((fileName) => fileName.endsWith(".json"))
    .sort();
}

function collectCssVariables(css: string): string[] {
  const variables = new Set<string>();
  const variablePattern = /--jfx-[A-Za-z0-9_-]+(?=\s*:)/g;
  let match: RegExpExecArray | null;

  while ((match = variablePattern.exec(css)) !== null) {
    variables.add(match[0]);
  }

  return [...variables].sort();
}

function countLeafTokens(value: unknown): number {
  if (!value || typeof value !== "object") {
    return 0;
  }

  if ("$value" in value) {
    return 1;
  }

  return Object.values(value).reduce((total, child) => total + countLeafTokens(child), 0);
}

function run(): void {
  const sourceFiles = listJsonFiles(sourceRoot);
  const themeFiles = listJsonFiles(themesRoot);
  const cssVariables = collectCssVariables(fs.readFileSync(generatedCssPath, "utf8"));

  const sourceTokenCount = sourceFiles.reduce((total, fileName) => {
    return total + countLeafTokens(readJson(path.join(sourceRoot, fileName)));
  }, 0);

  const themeTokenCount = themeFiles.reduce((total, fileName) => {
    return total + countLeafTokens(readJson(path.join(themesRoot, fileName)));
  }, 0);

  const derived = {
    version: 1,
    description: "Derived Modena token inventory generated from source token files and emitted CSS variables.",
    sourceFiles,
    themeFiles,
    counts: {
      sourceFiles: sourceFiles.length,
      themeFiles: themeFiles.length,
      sourceTokens: sourceTokenCount,
      themeTokens: themeTokenCount,
      cssVariables: cssVariables.length,
    },
    cssVariables,
  };

  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, `${JSON.stringify(derived, null, 2)}\n`, "utf8");

  console.log(`Token sources: ${sourceFiles.length}`);
  console.log(`Theme files: ${themeFiles.length}`);
  console.log(`CSS variables: ${cssVariables.length}`);
  console.log(`Wrote: ${path.relative(projectRoot, outputPath)}`);
}

run();
