import type { DependencyGraph } from "../models/types.js";
import type { GraphIndexes } from "../graph/indexes.js";

export interface TraversalResult {
  nodeIds: string[];
  cycleDetected: boolean;
}

export function traverseDependencies(
  graph: DependencyGraph,
  indexes: GraphIndexes,
  startIds: readonly string[],
  depth: number = Infinity
): TraversalResult {
  return traverse(graph, indexes.outgoing, "to", startIds, depth);
}

export function traverseDependents(
  graph: DependencyGraph,
  indexes: GraphIndexes,
  startIds: readonly string[],
  depth: number = Infinity
): TraversalResult {
  return traverse(graph, indexes.incoming, "from", startIds, depth);
}

export function findRootPaths(
  graph: DependencyGraph,
  indexes: GraphIndexes,
  targetIds: readonly string[]
): string[][] {
  const targets = new Set(targetIds);
  const paths: string[][] = [];
  const queue = graph.rootIds.map((id) => [id]);

  while (queue.length > 0) {
    const path = queue.shift();
    if (!path) continue;
    const current = path[path.length - 1];
    if (!current) continue;
    if (targets.has(current)) paths.push(path);

    for (const edge of indexes.outgoing.get(current) ?? []) {
      if (!path.includes(edge.to)) queue.push([...path, edge.to]);
    }
  }
  return paths;
}

function traverse(
  graph: DependencyGraph,
  index: ReadonlyMap<string, readonly { from: string; to: string }[]>,
  direction: "from" | "to",
  startIds: readonly string[],
  depth: number
): TraversalResult {
  const visited = new Set(startIds);
  const nodeIds: string[] = [];
  const queue = startIds.map((id) => ({ id, level: 0 }));
  let cycleDetected = false;

  while (queue.length > 0) {
    const entry = queue.shift();
    if (!entry || entry.level >= depth) continue;
    for (const edge of index.get(entry.id) ?? []) {
      const next = edge[direction];
      if (!graph.nodes.has(next)) continue;
      if (visited.has(next)) {
        cycleDetected = true;
        continue;
      }
      visited.add(next);
      nodeIds.push(next);
      queue.push({ id: next, level: entry.level + 1 });
    }
  }
  return { nodeIds, cycleDetected };
}
