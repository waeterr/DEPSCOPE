import { readFile, readdir } from "node:fs/promises";
import { join, extname } from "node:path";
import type { ProjectManifest } from "../project/manifest-schema.js";

export type UsageClassification =
  "likely-used" | "potentially-unused" | "unknown";

export interface UsageFinding {
  packageName: string;
  classification: UsageClassification;
  confidence: "low" | "medium" | "high";
  evidence: string[];
  limitations: string[];
}

export async function scanUnusedDependencies(
  projectRoot: string,
  manifest: ProjectManifest
): Promise<UsageFinding[]> {
  const direct = new Set([
    ...Object.keys(manifest.dependencies ?? {}),
    ...Object.keys(manifest.devDependencies ?? {}),
    ...Object.keys(manifest.optionalDependencies ?? {}),
  ]);

  const sourceFiles = await collectSourceFiles(projectRoot);
  const scriptText = Object.values(manifest.scripts ?? {}).join("\n");
  const importedNames = await extractImportedNames(sourceFiles, projectRoot);

  return [...direct]
    .sort()
    .map((name) =>
      classify(name, importedNames, scriptText, sourceFiles.length)
    );
}

async function collectSourceFiles(projectRoot: string): Promise<string[]> {
  const extensions = new Set([".ts", ".tsx", ".js", ".jsx", ".mjs", ".cjs"]);
  const exclude = new Set([
    "node_modules",
    "dist",
    "build",
    "coverage",
    ".git",
  ]);
  const files: string[] = [];
  const directories = [projectRoot];

  while (directories.length > 0) {
    const directory = directories.pop();
    if (!directory) continue;
    try {
      for (const entry of await readdir(directory, { withFileTypes: true })) {
        const path = join(directory, entry.name);
        if (entry.isDirectory() && !exclude.has(entry.name))
          directories.push(path);
        else if (entry.isFile() && extensions.has(extname(entry.name)))
          files.push(path);
      }
    } catch {}
  }
  return files;
}

async function extractImportedNames(
  files: string[],
  _projectRoot: string
): Promise<Set<string>> {
  const names = new Set<string>();
  const importPattern =
    /(?:import|require)\s*(?:\(['"]([@\w/-]+)['"]\)|['"]([^./@][^'"]*?)['"])/g;

  for (const file of files) {
    try {
      const content = await readFile(file, "utf8");
      for (const match of content.matchAll(importPattern)) {
        const name = match[1] ?? match[2];
        if (name) names.add(normalizePackageName(name));
      }
    } catch {}
  }
  return names;
}

function normalizePackageName(raw: string): string {
  if (raw.startsWith("@")) {
    const parts = raw.split("/");
    return parts.slice(0, 2).join("/");
  }
  return raw.split("/")[0] ?? raw;
}

function classify(
  name: string,
  imported: Set<string>,
  scriptText: string,
  fileCount: number
): UsageFinding {
  if (imported.has(name)) {
    return {
      packageName: name,
      classification: "likely-used",
      confidence: "high",
      evidence: ["Found in static imports"],
      limitations: [],
    };
  }
  if (scriptText.includes(name)) {
    return {
      packageName: name,
      classification: "likely-used",
      confidence: "medium",
      evidence: ["Referenced in package.json scripts"],
      limitations: ["Script reference may be indirect"],
    };
  }
  if (fileCount === 0) {
    return {
      packageName: name,
      classification: "unknown",
      confidence: "low",
      evidence: [],
      limitations: ["No source files found for analysis"],
    };
  }
  return {
    packageName: name,
    classification: "potentially-unused",
    confidence: "medium",
    evidence: [],
    limitations: [
      "Static analysis only. Dynamic imports, CLI tools, framework plugins, and type-only packages may not appear in imports.",
      "Review before removal.",
    ],
  };
}
