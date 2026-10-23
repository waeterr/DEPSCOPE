import type { Command } from "commander";
import { analyzeProject } from "../../project/analyze-project.js";
import { listSnapshots } from "../../storage/snapshot-store.js";
import { analysisJson, cwdFrom, output } from "./shared.js";

export async function historyCommand(
  _options: unknown,
  command: Command
): Promise<void> {
  const analysis = await analyzeProject(cwdFrom(command));
  const snapshots = await listSnapshots(analysis.project.rootPath);
  const text =
    snapshots.length === 0
      ? "No snapshots found."
      : snapshots
          .map(
            (snapshot) =>
              `${snapshot.id}\n  ${snapshot.createdAt}\n  ${snapshot.project.name ?? "unnamed"}\n  ${snapshot.graph.nodes.length} packages`
          )
          .join("\n\n");
  output(command, analysisJson(analysis, "history", snapshots), text);
}
