import { Command } from "commander";
import { scanCommand } from "./commands/scan.js";
import { treeCommand } from "./commands/tree.js";
import { statsCommand } from "./commands/stats.js";
import { whyCommand } from "./commands/why.js";
import { dependentsCommand } from "./commands/dependents.js";
import { duplicatesCommand } from "./commands/duplicates.js";
import { doctorCommand } from "./commands/doctor.js";

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
}
