import { describe, expect, it } from "vitest";
import type { DependencyGraph } from "../../src/core/models/types.js";
import { buildIndexes } from "../../src/core/graph/indexes.js";
import {
  calculateStats,
  findDuplicates,
  maximumDependencyDepth,
  reachableDependencies,
} from "../../src/core/analyzer/analysis.js";
import {
  findRootPaths,
  traverseDependencies,
  traverseDependents,
} from "../../src/core/traversal/traverse.js";

const graph: DependencyGraph = {
  nodes: new Map([
    ["a", node("a", "a", "1.0.0", true)],
    ["b", node("b", "b", "1.0.0", true, ["dev"])],
    ["shared-v1", node("shared-v1", "shared", "1.0.0")],
    ["shared-v2", node("shared-v2", "shared", "2.0.0")],
    ["leaf", node("leaf", "leaf", "1.0.0")],
  ]),
  edges: [
    { from: "a", to: "shared-v1", kind: "prod" },
    { from: "b", to: "shared-v2", kind: "dev" },
    { from: "shared-v1", to: "leaf", kind: "prod" },
    { from: "leaf", to: "a", kind: "prod" },
  ],
  rootIds: ["a", "b"],
};

function node(
  id: string,
  name: string,
  version: string,
  isDirect = false,
  dependencyKinds: ("prod" | "dev")[] = ["prod"]
) {
  return {
    id,
    name,
    version,
    source: "lockfile" as const,
    isDirect,
    dependencyKinds,
  };
}

describe("dependency graph algorithms", () => {
  const indexes = buildIndexes(graph);

  it("indexes outgoing, incoming, name and version references", () => {
    expect(indexes.outgoing.get("a")).toHaveLength(1);
    expect(indexes.incoming.get("shared-v1")).toHaveLength(1);
    expect(indexes.byName.get("shared")).toHaveLength(2);
    expect(indexes.byNameVersion.get("shared@1.0.0")).toHaveLength(1);
  });

  it("traverses dependencies and detects cycles", () => {
    expect(traverseDependencies(graph, indexes, ["a"])).toEqual({
      nodeIds: ["shared-v1", "leaf"],
      cycleDetected: true,
    });
  });

  it("traverses dependents", () => {
    expect(traverseDependents(graph, indexes, ["leaf"])).toEqual({
      nodeIds: ["shared-v1", "a"],
      cycleDetected: true,
    });
  });

  it("finds cycle-safe paths from roots", () => {
    expect(findRootPaths(graph, indexes, ["leaf"])).toEqual([
      ["a", "shared-v1", "leaf"],
    ]);
  });

  it("groups duplicate package versions", () => {
    const duplicates = findDuplicates(graph);
    expect(duplicates).toHaveLength(1);
    expect([...duplicates[0]!.versions.keys()]).toEqual(["1.0.0", "2.0.0"]);
  });

  it("calculates version-aware graph statistics", () => {
    expect(maximumDependencyDepth(graph)).toBe(2);
    expect(calculateStats(graph)).toMatchObject({
      directProduction: 1,
      directDevelopment: 1,
      uniquePackageNames: 4,
      uniqueNameVersionPairs: 5,
      totalResolvedInstances: 5,
      totalEdges: 4,
      maximumDepth: 2,
      duplicatePackageNames: 1,
    });
    expect(reachableDependencies(graph)).toEqual(
      new Set(["a", "b", "shared-v1", "shared-v2", "leaf"])
    );
  });
});
