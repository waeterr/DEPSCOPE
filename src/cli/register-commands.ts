import { Command } from "commander";
import { scanCommand } from "./commands/scan.js";
import { treeCommand } from "./commands/tree.js";
import { statsCommand } from "./commands/stats.js";
import { whyCommand } from "./commands/why.js";
import { dependentsCommand } from "./commands/dependents.js";
import { duplicatesCommand } from "./commands/duplicates.js";
import { doctorCommand } from "./commands/doctor.js";
import { impactCommand } from "./commands/impact.js";
import { reportCommand } from "./commands/report.js";
import { sizeCommand } from "./commands/size.js";
import { unusedCommand } from "./commands/unused.js";
import { snapshotCommand } from "./commands/snapshot.js";
import { historyCommand } from "./commands/history.js";
import { diffCommand } from "./commands/diff.js";
import { graphCommand } from "./commands/graph.js";
import { completionsCommand } from "./commands/completions.js";

export function registerCommands(program: Command): void {
  program
    .command("scan")
    .description("Analyze the current project")
    .action(scanCommand);

  program
    .command("tree")
    .description("Display dependency hierarchy")
    .option("--depth <n>", "Limit display depth", parseInt)
    .option("--type <type>", "Filter by dependency type (prod|dev|optional)")
    .action(treeCommand);

  program
    .command("stats")
    .description("Show dependency statistics")
    .action(statsCommand);

  program
    .command("why <package>")
    .description("Explain why a package exists")
    .action(whyCommand);

  program
    .command("dependents <package>")
    .description("Show packages depending on a package")
    .action(dependentsCommand);

  program
    .command("duplicates")
    .description("Find multiple installed versions")
    .action(duplicatesCommand);

  program
    .command("doctor")
    .description("Diagnose project and lockfile issues")
    .action(doctorCommand);

  program
    .command("unused")
    .description("Detect potentially unused direct dependencies")
    .action(unusedCommand);

  program
    .command("size")
    .description("Measure installed dependency footprint")
    .option("--top <n>", "Show the largest N packages", "20")
    .action(sizeCommand);

  program
    .command("impact <package>")
    .description("Analyze graph impact of changing a package")
    .action(impactCommand);

  program
    .command("report")
    .description("Generate a consolidated dependency report")
    .option(
      "--max-duplicates <n>",
      "Fail if duplicate package groups exceed N",
      Number
    )
    .option(
      "--max-diagnostics <n>",
      "Fail if diagnostics exceed N",
      Number
    )
    .action(reportCommand);

  program
    .command("snapshot")
    .description("Save a local dependency snapshot")
    .option("--name <name>", "Set a snapshot name")
    .action(snapshotCommand);

  program
    .command("history")
    .description("List local dependency snapshots")
    .action(historyCommand);

  program
    .command("diff")
    .description("Compare a snapshot with the current project")
    .option("--from <id>", "Select a snapshot ID")
    .action(diffCommand);

  program
    .command("graph")
    .description("Export dependency graph data")
    .option("--format <format>", "Output format: json or dot", "json")
    .action(graphCommand);

  program
    .command("completions <shell>")
    .description("Generate shell completion scripts")
    .action(completionsCommand);
}
