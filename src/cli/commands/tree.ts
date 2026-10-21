import type { Command } from "commander";
import { analyzeProject } from "../../project/analyze-project.js";
import { DepScopeError } from "../../utils/errors.js";
import { analysisJson, cwdFrom, output } from "./shared.js";

interface TreeOptions {
  depth?: number;
  type?: string;
}

export async function treeCommand(
  options: TreeOptions,
  command: Command
): Promise<void> {
  const analysis = await analyzeProject(cwdFrom(command));
  if (!analysis.graph) {
    throw new DepScopeError(
      "Dependency tree requires a supported package-lock.json.",
      "GRAPH_UNAVAILABLE"
    );
  }
  const { graph } = analysis.graph;
  const maxDepth = options.depth ?? Infinity;
  const selectedType = options.type;
  const lines: string[] = [];
  const serialized: { id: string; children: string[] }[] = [];

  for (const rootId of graph.rootIds) {
    render(rootId, 0, new Set());
  }

  function render(id: string, level: number, path: Set<string>): void {
    const node = graph.nodes.get(id);
    if (
      !node ||
      level > maxDepth ||
      (selectedType && !node.dependencyKinds.includes(selectedType as "prod"))
    )
      return;
    const prefix = level === 0 ? "" : `${"  ".repeat(level - 1)}└─ `;
    lines.push(`${prefix}${node.name}@${node.version}`);
    if (path.has(id)) {
      lines.push(`${"  ".repeat(level)}└─ [cycle]`);
      return;
    }
    const children = graph.edges
      .filter((edge) => edge.from === id)
      .map((edge) => edge.to);
    serialized.push({ id, children });
    const nextPath = new Set(path).add(id);
    for (const childId of children) render(childId, level + 1, nextPath);
  }

  output(command, analysisJson(analysis, "tree", serialized), lines.join("\n"));
}
