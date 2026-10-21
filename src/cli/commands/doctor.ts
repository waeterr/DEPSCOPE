import type { Command } from "commander";
import { analyzeProject } from "../../project/analyze-project.js";
import { analysisJson, cwdFrom, output } from "./shared.js";

export async function doctorCommand(
  _options: unknown,
  command: Command
): Promise<void> {
  const analysis = await analyzeProject(cwdFrom(command));
  const diagnostics = analysis.diagnostics;
  const text =
    diagnostics.length === 0
      ? "No diagnostics found."
      : diagnostics
          .map(
            (item) =>
              `${item.severity.toUpperCase()} [${item.code}]\n${item.message}`
          )
          .join("\n\n");
  output(command, analysisJson(analysis, "doctor", diagnostics), text);
}
