import type { Command } from "commander";
import { analyzeProject } from "../../project/analyze-project.js";
import { calculateStats } from "../../core/analyzer/analysis.js";
import { analysisJson, cwdFrom, output } from "./shared.js";

export async function statsCommand(
  _options: unknown,
  command: Command
): Promise<void> {
  const analysis = await analyzeProject(cwdFrom(command));
  if (!analysis.graph)
    throw new Error("Statistics require a supported package-lock.json.");
  const stats = calculateStats(analysis.graph.graph);
  output(
    command,
    analysisJson(analysis, "stats", stats),
    Object.entries(stats)
      .map(([key, value]) => `${key}: ${value}`)
      .join("\n")
  );
}
