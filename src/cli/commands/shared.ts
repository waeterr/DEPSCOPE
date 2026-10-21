import type { Command } from "commander";
import type { ProjectAnalysis } from "../../project/analyze-project.js";

export function cwdFrom(command: Command): string {
  const options = command.optsWithGlobals<{ cwd?: string }>();
  return options.cwd ?? process.cwd();
}

export function jsonEnabled(command: Command): boolean {
  return command.optsWithGlobals<{ json?: boolean }>().json === true;
}

export function output(command: Command, value: unknown, text: string): void {
  console.log(jsonEnabled(command) ? JSON.stringify(value, null, 2) : text);
}

export function analysisJson(
  analysis: ProjectAnalysis,
  command: string,
  data: unknown
): object {
  return {
    schemaVersion: "1.0.0",
    toolVersion: "0.1.0",
    command,
    project: {
      name: analysis.project.name,
      packageManager: analysis.project.packageManager,
    },
    complete: analysis.graph?.complete ?? false,
    warnings: analysis.diagnostics,
    data,
  };
}
