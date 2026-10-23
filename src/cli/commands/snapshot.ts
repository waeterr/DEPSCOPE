import type { Command } from "commander";
import { analyzeProject } from "../../project/analyze-project.js";
import { DepScopeError } from "../../utils/errors.js";
import { saveSnapshot } from "../../storage/snapshot-store.js";
import { analysisJson, cwdFrom, output } from "./shared.js";

interface SnapshotOptions {
  name?: string;
}

export async function snapshotCommand(
  options: SnapshotOptions,
  command: Command
): Promise<void> {
  const analysis = await analyzeProject(cwdFrom(command));
  if (!analysis.graph)
    throw new DepScopeError(
      "Snapshots require a supported package-lock.json.",
      "GRAPH_UNAVAILABLE"
    );
  const snapshot = await saveSnapshot({
    projectRoot: analysis.project.rootPath,
    project: analysis.project,
    graph: analysis.graph.graph,
    diagnostics: analysis.diagnostics,
    complete: analysis.graph.complete,
    ...(options.name ? { name: options.name } : {}),
  });
  output(
    command,
    analysisJson(analysis, "snapshot", snapshot),
    `Snapshot saved: ${snapshot.id}`
  );
}
