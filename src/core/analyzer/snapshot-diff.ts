import type { DependencySnapshot } from "../../storage/snapshot-store.js";

export interface SnapshotDiff {
  added: string[];
  removed: string[];
  versionChanges: { name: string; from: string[]; to: string[] }[];
}

export function diffSnapshots(
  before: DependencySnapshot,
  after: DependencySnapshot
): SnapshotDiff {
  const beforePairs = pairs(before);
  const afterPairs = pairs(after);
  const added = [...afterPairs].filter((pair) => !beforePairs.has(pair)).sort();
  const removed = [...beforePairs]
    .filter((pair) => !afterPairs.has(pair))
    .sort();
  const names = new Set([
    ...before.graph.nodes.map((node) => node.name),
    ...after.graph.nodes.map((node) => node.name),
  ]);
  const versionChanges = [...names]
    .map((name) => ({
      name,
      from: versions(before, name),
      to: versions(after, name),
    }))
    .filter(
      (entry) =>
        entry.from.length > 0 &&
        entry.to.length > 0 &&
        entry.from.join() !== entry.to.join()
    )
    .sort((a, b) => a.name.localeCompare(b.name));
  return { added, removed, versionChanges };
}

function pairs(snapshot: DependencySnapshot): Set<string> {
  return new Set(
    snapshot.graph.nodes.map((node) => `${node.name}@${node.version}`)
  );
}

function versions(snapshot: DependencySnapshot, name: string): string[] {
  return [
    ...new Set(
      snapshot.graph.nodes
        .filter((node) => node.name === name)
        .map((node) => node.version)
    ),
  ].sort();
}
