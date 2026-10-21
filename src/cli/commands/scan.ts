import type { Command } from "commander";
import { analyzeProject } from "../../project/analyze-project.js";
import { calculateStats } from "../../core/analyzer/analysis.js";
import { analysisJson, cwdFrom, output } from "./shared.js";

export async function scanCommand(
  _options: unknown,
  command: Command
): Promise<void> {
  const analysis = await analyzeProject(cwdFrom(command));
  const stats = analysis.graph
    ? calculateStats(analysis.graph.graph)
    : undefined;
  const data = {
    project: analysis.project,
    ...(stats ? { stats } : {}),
    diagnostics: analysis.diagnostics,
  };
  const text = [
    "DEPSCOPE",
    "",
    `Project: ${analysis.project.name ?? "unnamed"}`,
    `Manager: ${analysis.project.packageManager ?? "unknown"}`,
    `Lockfile: ${analysis.project.lockfilePath ?? "not found"}`,
    ...(stats
      ? [
          "",
          `Direct: ${stats.directProduction + stats.directDevelopment}`,
          `Total nodes: ${stats.totalResolvedInstances}`,
          `Duplicate packages: ${stats.duplicatePackageNames}`,
        ]
      : []),
    ...analysis.diagnostics.map(
      (diagnostic) =>
        `${diagnostic.severity.toUpperCase()} [${diagnostic.code}]: ${diagnostic.message}`
    ),
  ].join("\n");
  output(command, analysisJson(analysis, "scan", data), text);
}
