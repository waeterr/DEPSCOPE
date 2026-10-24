import type { Command } from "commander";
import { analyzeProject } from "../../project/analyze-project.js";
import { DepScopeError } from "../../utils/errors.js";
import { analysisJson, cwdFrom, output } from "./shared.js";

interface GraphOptions {
  format?: string;
}

export async function graphCommand(
  options: GraphOptions,
  command: Command
): Promise<void> {
  const analysis = await analyzeProject(cwdFrom(command));
  if (!analysis.graph) {
    throw new DepScopeError(
      "Graph export requires a supported package-lock.json.",
      "GRAPH_UNAVAILABLE"
    );
  }
  const graph = analysis.graph.graph;
  const data = {
    nodes: [...graph.nodes.values()],
    edges: graph.edges,
    rootIds: graph.rootIds,
  };
  const format = options.format ?? "json";
  if (format === "dot") {
    if (command.optsWithGlobals<{ json?: boolean }>().json) {
      throw new DepScopeError(
        "--json cannot be combined with --format dot.",
        "INVALID_OPTION"
      );
    }
    console.log(toDot(data));
    return;
  }
  if (format !== "json") {
    throw new DepScopeError(
      "Supported graph formats: json, dot.",
      "INVALID_OPTION"
    );
  }
  output(
    command,
    analysisJson(analysis, "graph", data),
    JSON.stringify(data, null, 2)
  );
}

function toDot(data: {
  nodes: { id: string; name: string; version: string }[];
  edges: { from: string; to: string }[];
}): string {
  const escape = (value: string): string =>
    value.replaceAll("\\", "\\\\").replaceAll('"', '\\"');
  return [
    "digraph packagelens {",
    "  rankdir=LR;",
    ...data.nodes.map(
      (node) =>
        `  "${escape(node.id)}" [label="${escape(`${node.name}@${node.version}`)}"];`
    ),
    ...data.edges.map(
      (edge) => `  "${escape(edge.from)}" -> "${escape(edge.to)}";`
    ),
    "}",
  ].join("\n");
}
