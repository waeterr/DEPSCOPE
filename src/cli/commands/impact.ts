import type { Command } from "commander";
import { analyzeProject } from "../../project/analyze-project.js";
import { analyzeImpact } from "../../core/analyzer/impact.js";
import { DepScopeError } from "../../utils/errors.js";
import { analysisJson, cwdFrom, output } from "./shared.js";

export async function impactCommand(
  packageName: string,
  _options: unknown,
  command: Command
): Promise<void> {
  const analysis = await analyzeProject(cwdFrom(command));
  if (!analysis.graph)
    throw new DepScopeError(
      "Impact analysis requires a supported package-lock.json.",
      "GRAPH_UNAVAILABLE"
    );
  const result = analyzeImpact(analysis.graph.graph, packageName);
  const text =
    result.instances.length === 0
      ? `Package not found: ${packageName}`
      : [
          `Instances: ${result.instances.length}`,
          `Direct dependents: ${result.directDependents.length}`,
          `Transitive dependents: ${result.transitiveDependents.length}`,
          `Affected direct roots: ${result.affectedRoots.length}`,
          "",
          "Graph evidence only. Review paths before removing or upgrading this package.",
        ].join("\n");
  output(command, analysisJson(analysis, "impact", result), text);
}
