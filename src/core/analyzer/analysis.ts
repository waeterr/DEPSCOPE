import type { DependencyGraph, DependencyNode } from "../models/types.js";
import { buildIndexes } from "../graph/indexes.js";
import { traverseDependencies } from "../traversal/traverse.js";

export interface DuplicateGroup {
  name: string;
  versions: Map<string, DependencyNode[]>;
}

export function findDuplicates(graph: DependencyGraph): DuplicateGroup[] {
  const { byName } = buildIndexes(graph);
  return [...byName.entries()]
    .map(([name, nodes]) => ({
      name,
      versions: groupByVersion(nodes),
    }))
    .filter((group) => group.versions.size > 1)
    .sort((a, b) => a.name.localeCompare(b.name));
}

export function maximumDependencyDepth(graph: DependencyGraph): number {
  const indexes = buildIndexes(graph);
  let maxDepth = 0;

  for (const rootId of graph.rootIds) {
    const depths = new Map<string, number>([[rootId, 0]]);
    const queue = [rootId];
    while (queue.length > 0) {
      const id = queue.shift();
      if (!id) continue;
      const currentDepth = depths.get(id) ?? 0;
      maxDepth = Math.max(maxDepth, currentDepth);
      for (const edge of indexes.outgoing.get(id) ?? []) {
        if (!depths.has(edge.to)) {
          depths.set(edge.to, currentDepth + 1);
          queue.push(edge.to);
        }
      }
    }
  }
  return maxDepth;
}

export interface DependencyStats {
  directProduction: number;
  directDevelopment: number;
  directOptional: number;
  directPeer: number;
  uniquePackageNames: number;
  uniqueNameVersionPairs: number;
  totalResolvedInstances: number;
  totalEdges: number;
  maximumDepth: number;
  duplicatePackageNames: number;
}

export function calculateStats(graph: DependencyGraph): DependencyStats {
  const indexes = buildIndexes(graph);
  const directNodes = graph.rootIds.flatMap((id) => {
    const node = graph.nodes.get(id);
    return node ? [node] : [];
  });
  return {
    directProduction: directNodes.filter((node) =>
      node.dependencyKinds.includes("prod")
    ).length,
    directDevelopment: directNodes.filter((node) =>
      node.dependencyKinds.includes("dev")
    ).length,
    directOptional: directNodes.filter((node) =>
      node.dependencyKinds.includes("optional")
    ).length,
    directPeer: directNodes.filter((node) =>
      node.dependencyKinds.includes("peer")
    ).length,
    uniquePackageNames: indexes.byName.size,
    uniqueNameVersionPairs: indexes.byNameVersion.size,
    totalResolvedInstances: graph.nodes.size,
    totalEdges: graph.edges.length,
    maximumDepth: maximumDependencyDepth(graph),
    duplicatePackageNames: findDuplicates(graph).length,
  };
}

export function reachableDependencies(graph: DependencyGraph): Set<string> {
  const result = traverseDependencies(
    graph,
    buildIndexes(graph),
    graph.rootIds
  );
  return new Set([...graph.rootIds, ...result.nodeIds]);
}

function groupByVersion(
  nodes: readonly DependencyNode[]
): Map<string, DependencyNode[]> {
  const versions = new Map<string, DependencyNode[]>();
  for (const node of nodes) {
    const instances = versions.get(node.version);
    if (instances) instances.push(node);
    else versions.set(node.version, [node]);
  }
  return versions;
}
