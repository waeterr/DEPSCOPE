import { Command } from "commander";
import pc from "picocolors";
import { registerCommands } from "./register-commands.js";
import { DepScopeError } from "../utils/errors.js";

const program = new Command();

program
  .name("packagelens")
  .description("Understand What Your Dependencies Are Doing")
  .version("0.1.0", "-v, --version", "Display version")
  .helpOption("-h, --help", "Display help");

program
  .option("--cwd <path>", "Set the project directory", process.cwd())
  .option("--json", "Output JSON format")
  .option("--quiet", "Suppress informational output")
  .option("--verbose", "Enable verbose output")
  .option("--no-color", "Disable colored output");

registerCommands(program);

if (process.argv.length === 2) {
  console.log(pc.bold(pc.cyan("\nPACKAGELENS")));
  console.log("Understand What Your Dependencies Are Doing\n");
  console.log("Usage: packagelens <command> [options]\n");
  console.log("Commands:");
  console.log("  scan          Analyze the current project");
  console.log("  tree          Display dependency hierarchy");
  console.log("  stats         Show dependency statistics");
  console.log("  why           Explain why a package exists");
  console.log("  dependents    Show packages depending on a package");
  console.log("  duplicates    Find multiple installed versions");
  console.log("  doctor        Diagnose project and lockfile issues\n");
  console.log(`Run ${pc.cyan("packagelens --help")} for detailed information.`);
  process.exit(0);
}

program.parse(process.argv);

process.on("unhandledRejection", (reason) => {
  if (reason instanceof DepScopeError) {
    console.error(pc.red(`\nError [${reason.code}]:`));
    console.error(reason.message);
    process.exit(reason.exitCode);
  } else {
    console.error(pc.red("\nUnexpected error:"));
    console.error(reason);
    process.exit(1);
  }
});
