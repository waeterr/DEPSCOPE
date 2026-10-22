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
    .action(reportCommand);
}
