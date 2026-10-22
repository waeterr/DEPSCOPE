import type { Command } from "commander";
import { analyzeProject } from "../../project/analyze-project.js";
import { scanUnusedDependencies } from "../../analysis/unused.js";
import { readManifest } from "../../project/manifest-reader.js";
import { analysisJson, cwdFrom, output } from "./shared.js";

export async function unusedCommand(
  _options: unknown,
  command: Command
): Promise<void> {
  const cwd = cwdFrom(command);
  const analysis = await analyzeProject(cwd);
  const manifest = await readManifest(analysis.project.rootPath);
  const findings = await scanUnusedDependencies(
    analysis.project.rootPath,
    manifest
  );

  const potentiallyUnused = findings.filter(
    (f) => f.classification === "potentially-unused"
  );
  const unknown = findings.filter((f) => f.classification === "unknown");

  const text =
    findings.length === 0
      ? "No direct dependencies found to analyze."
      : [
          `Analyzed ${findings.length} direct dependencies`,
          "",
          potentiallyUnused.length === 0
            ? "No potentially unused dependencies detected."
            : potentiallyUnused
                .map(
                  (f) =>
                    `potentially-unused  ${f.packageName}\n  Confidence: ${f.confidence}\n  ${f.limitations[0] ?? ""}`
                )
                .join("\n\n"),
          ...(unknown.length > 0
            ? [
                "",
                `${unknown.length} package(s) could not be analyzed (no source files found).`,
              ]
            : []),
        ].join("\n");

  output(command, analysisJson(analysis, "unused", findings), text);
}
