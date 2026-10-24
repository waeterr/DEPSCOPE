import type { Command } from "commander";
import { analyzeProject } from "../../project/analyze-project.js";
import {
  calculateStats,
  findDuplicates,
} from "../../core/analyzer/analysis.js";
import { DepScopeError } from "../../utils/errors.js";
import { analysisJson, cwdFrom, output } from "./shared.js";

interface ReportOptions {
  maxDuplicates?: number;
}

export async function reportCommand(
  options: ReportOptions,
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
  if (
    options.maxDuplicates !== undefined &&
    (!Number.isInteger(options.maxDuplicates) || options.maxDuplicates < 0)
  ) {
    throw new DepScopeError(
      "--max-duplicates must be a non-negative integer.",
      "INVALID_OPTION"
    );
  }
  output(command, analysisJson(analysis, "report", data), text);
  if (
    options.maxDuplicates !== undefined &&
    duplicates.length > options.maxDuplicates
  ) {
    throw new DepScopeError(
      `Duplicate package groups (${duplicates.length}) exceed maximum (${options.maxDuplicates}).`,
      "THRESHOLD_EXCEEDED",
      2
    );
  }
}
