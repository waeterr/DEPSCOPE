import type { Command } from "commander";
import { analyzeProject } from "../../project/analyze-project.js";
import { buildIndexes } from "../../core/graph/indexes.js";
import { traverseDependents } from "../../core/traversal/traverse.js";
import { DepScopeError } from "../../utils/errors.js";
import { analysisJson, cwdFrom, output } from "./shared.js";

export async function dependentsCommand(
  packageName: string,
  _options: unknown,
  command: Command
): Promise<void> {
  const analysis = await analyzeProject(cwdFrom(command));
  if (!analysis.graph) {
    throw new DepScopeError(
      "Reverse dependency analysis requires a supported package-lock.json.",
      "GRAPH_UNAVAILABLE"
    );
  }
  const { graph } = analysis.graph;
  const targets = [...graph.nodes.values()].filter(
    (node) => node.name === packageName
  );
  const indexes = buildIndexes(graph);
  const dependents = traverseDependents(
    graph,
    indexes,
    targets.map((node) => node.id)
  );
  const data = {
    package: packageName,
    instances: targets,
    dependents: dependents.nodeIds.map((id) => graph.nodes.get(id)),
    cycleDetected: dependents.cycleDetected,
  };
  const text =
    targets.length === 0
      ? `Package not found: ${packageName}`
      : data.dependents.length === 0
        ? `No packages depend on ${packageName}.`
        : data.dependents
            .map((node) => `${node!.name}@${node!.version}`)
            .join("\n");
  output(command, analysisJson(analysis, "dependents", data), text);
}
