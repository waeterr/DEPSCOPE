import type { Command } from "commander";
import { analyzeProject } from "../../project/analyze-project.js";
import {
  measureFootprint,
  formatBytes,
} from "../../core/analyzer/footprint.js";
import { DepScopeError } from "../../utils/errors.js";
import { analysisJson, cwdFrom, output } from "./shared.js";

interface SizeOptions {
  top?: string;
}

export async function sizeCommand(
  options: SizeOptions,
  command: Command
): Promise<void> {
  const analysis = await analyzeProject(cwdFrom(command));
  if (!analysis.graph) {
    throw new DepScopeError(
      "Size analysis requires a supported package-lock.json.",
      "GRAPH_UNAVAILABLE"
    );
  }
  if (!analysis.project.rootPath) {
    throw new DepScopeError(
      "Could not determine project root.",
      "PROJECT_NOT_FOUND"
    );
  }

  const topN = options.top !== undefined ? parseInt(options.top, 10) : 20;
  const result = await measureFootprint(
    analysis.graph.graph,
    analysis.project.rootPath
  );
  const displayed = result.packages.slice(0, topN);

  const text =
    result.packages.length === 0
      ? "No installed packages found. Run npm install first."
      : [
          `Total installed size: ${formatBytes(result.totalBytes)} (approximate)`,
          "",
          ...displayed.map(
            (pkg) => `${pkg.name}@${pkg.version}  ${formatBytes(pkg.bytes)}`
          ),
          ...(result.packages.length > topN
            ? [`... and ${result.packages.length - topN} more`]
            : []),
        ].join("\n");

  output(
    command,
    analysisJson(analysis, "size", { ...result, packages: displayed }),
    text
  );
}
