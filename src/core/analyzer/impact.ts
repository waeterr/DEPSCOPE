import type { DependencyGraph } from "../models/types.js";
import { buildIndexes } from "../graph/indexes.js";
import { traverseDependents } from "../traversal/traverse.js";

export interface ImpactResult {
  packageName: string;
  instances: string[];
  directDependents: string[];
  transitiveDependents: string[];
  affectedRoots: string[];
}

export function analyzeImpact(
  graph: DependencyGraph,
  packageName: string
): ImpactResult {
  const indexes = buildIndexes(graph);
  const instances = [...graph.nodes.values()]
    .filter((node) => node.name === packageName)
    .map((node) => node.id);

  const directDependentIds = new Set<string>();
  for (const id of instances) {
    for (const edge of indexes.incoming.get(id) ?? []) {
      directDependentIds.add(edge.from);
    }
  }

  const { nodeIds: transitiveIds } = traverseDependents(
    graph,
    indexes,
    instances
  );
  const transitiveDependents = transitiveIds.filter(
    (id) => !directDependentIds.has(id)
  );

  const affectedRoots = graph.rootIds.filter((rootId) => {
    const node = graph.nodes.get(rootId);
    return (
      node &&
      (instances.includes(rootId) ||
        directDependentIds.has(rootId) ||
        transitiveIds.includes(rootId))
    );
  });

  return {
    packageName,
    instances,
    directDependents: [...directDependentIds],
    transitiveDependents,
    affectedRoots,
  };
}
