import type { Command } from "commander";
import { analyzeProject } from "../../project/analyze-project.js";
import { findDuplicates } from "../../core/analyzer/analysis.js";
import { analysisJson, cwdFrom, output } from "./shared.js";

export async function duplicatesCommand(
  _options: unknown,
  command: Command
): Promise<void> {
  const analysis = await analyzeProject(cwdFrom(command));
  if (!analysis.graph)
    throw new Error(
      "Duplicate detection requires a supported package-lock.json."
    );
  const duplicates = findDuplicates(analysis.graph.graph).map((group) => ({
    name: group.name,
    versions: [...group.versions.entries()].map(([version, nodes]) => ({
      version,
      instances: nodes.map((node) => node.id),
    })),
  }));
  const text =
    duplicates.length === 0
      ? "No duplicate versions found."
      : duplicates
          .map(
            (group) =>
              `${group.name}\n${group.versions.map((version) => `  ${version.version}: ${version.instances.length} instances`).join("\n")}`
          )
          .join("\n\n");
  output(command, analysisJson(analysis, "duplicates", duplicates), text);
}
