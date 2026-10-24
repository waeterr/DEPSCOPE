import type { Command } from "commander";
import { analyzeProject } from "../../project/analyze-project.js";
import { diffSnapshots } from "../../core/analyzer/snapshot-diff.js";
import { listSnapshots } from "../../storage/snapshot-store.js";
import { DepScopeError } from "../../utils/errors.js";
import { analysisJson, cwdFrom, output } from "./shared.js";

interface DiffOptions {
  from?: string;
  maxAdded?: number;
  maxRemoved?: number;
  maxVersionChanges?: number;
}

export async function diffCommand(
  options: DiffOptions,
  command: Command
): Promise<void> {
  for (const [option, maximum] of Object.entries({
    "--max-added": options.maxAdded,
    "--max-removed": options.maxRemoved,
    "--max-version-changes": options.maxVersionChanges,
  })) {
    if (maximum !== undefined && (!Number.isInteger(maximum) || maximum < 0)) {
      throw new DepScopeError(
        `${option} must be a non-negative integer.`,
        "INVALID_OPTION"
      );
    }
  }
  const analysis = await analyzeProject(cwdFrom(command));
  if (!analysis.graph)
    throw new DepScopeError(
      "Dependency diff requires a supported package-lock.json.",
      "GRAPH_UNAVAILABLE"
    );
  const snapshots = await listSnapshots(analysis.project.rootPath);
  const before = options.from
    ? snapshots.find((snapshot) => snapshot.id === options.from)
    : snapshots[0];
  if (!before)
    throw new DepScopeError(
      "No matching snapshot found. Create one with packagelens snapshot first.",
      "SNAPSHOT_NOT_FOUND"
    );
  const after = {
    schemaVersion: "1.0.0" as const,
    id: "current",
    createdAt: analysis.project.analysisTimestamp,
    toolVersion: "0.1.0",
    project: {
      name: analysis.project.name,
      packageManager: analysis.project.packageManager,
    },
    graph: {
      nodes: [...analysis.graph.graph.nodes.values()],
      edges: analysis.graph.graph.edges,
      rootIds: analysis.graph.graph.rootIds,
    },
    diagnostics: analysis.diagnostics,
    complete: analysis.graph.complete,
  };
  const result = diffSnapshots(before, after);
  const thresholds = {
    "--max-added": [options.maxAdded, result.added.length],
    "--max-removed": [options.maxRemoved, result.removed.length],
    "--max-version-changes": [
      options.maxVersionChanges,
      result.versionChanges.length,
    ],
  } as const;
  const text = [
    `Added: ${result.added.length}`,
    `Removed: ${result.removed.length}`,
    `Version changes: ${result.versionChanges.length}`,
  ].join("\n");
  output(command, analysisJson(analysis, "diff", result), text);
  for (const [option, [maximum, actual]] of Object.entries(thresholds)) {
    if (maximum !== undefined && actual > maximum) {
      throw new DepScopeError(
        `${option} threshold exceeded: ${actual} > ${maximum}.`,
        "THRESHOLD_EXCEEDED",
        2
      );
    }
  }
}
