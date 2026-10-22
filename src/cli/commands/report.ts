import type { Command } from "commander";
import { analyzeProject } from "../../project/analyze-project.js";
import {
  calculateStats,
  findDuplicates,
} from "../../core/analyzer/analysis.js";
import { analysisJson, cwdFrom, output } from "./shared.js";

export async function reportCommand(
  _options: unknown,
  command: Command
): Promise<void> {
  const analysis = await analyzeProject(cwdFrom(command));
  const stats = analysis.graph
    ? calculateStats(analysis.graph.graph)
    : undefined;
  const duplicates = analysis.graph ? findDuplicates(analysis.graph.graph) : [];
  const data = {
    project: analysis.project,
    stats,
    duplicates,
    diagnostics: analysis.diagnostics,
  };
  const text = [
    "DEPSCOPE REPORT",
    "",
    `Project: ${analysis.project.name ?? "unnamed"}`,
    `Package manager: ${analysis.project.packageManager ?? "unknown"}`,
    `Graph complete: ${analysis.graph?.complete ?? false}`,
    ...(stats
      ? [
          "",
          "Statistics",
          `  Resolved instances: ${stats.totalResolvedInstances}`,
          `  Graph edges: ${stats.totalEdges}`,
          `  Maximum depth: ${stats.maximumDepth}`,
          `  Duplicate package names: ${stats.duplicatePackageNames}`,
        ]
      : []),
    "",
    `Diagnostics: ${analysis.diagnostics.length}`,
    ...(duplicates.length > 0
      ? ["", `Duplicate groups: ${duplicates.map((d) => d.name).join(", ")}`]
      : []),
  ].join("\n");
  output(command, analysisJson(analysis, "report", data), text);
}
