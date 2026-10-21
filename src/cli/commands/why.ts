import type { Command } from "commander";
import { analyzeProject } from "../../project/analyze-project.js";
import { buildIndexes } from "../../core/graph/indexes.js";
import { findRootPaths } from "../../core/traversal/traverse.js";
import { analysisJson, cwdFrom, output } from "./shared.js";

export async function whyCommand(
  packageName: string,
  _options: unknown,
  command: Command
): Promise<void> {
  const analysis = await analyzeProject(cwdFrom(command));
  if (!analysis.graph)
    throw new Error(
      "Dependency explanation requires a supported package-lock.json."
    );
  const { graph } = analysis.graph;
  const targets = [...graph.nodes.values()].filter(
    (node) => node.name === packageName
  );
  const paths = findRootPaths(
    graph,
    buildIndexes(graph),
    targets.map((node) => node.id)
  );
  const data = { package: packageName, instances: targets, paths };
  const text =
    targets.length === 0
      ? `Package not found: ${packageName}`
      : paths
          .map((path) =>
            path
              .map((id) => {
                const node = graph.nodes.get(id)!;
                return `${node.name}@${node.version}`;
              })
              .join("\n  └─ ")
          )
          .join("\n\n");
  output(command, analysisJson(analysis, "why", data), text);
}
