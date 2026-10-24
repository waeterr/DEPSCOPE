import { DepScopeError } from "../../utils/errors.js";

const commands = [
  "scan",
  "tree",
  "stats",
  "why",
  "dependents",
  "duplicates",
  "doctor",
  "unused",
  "size",
  "impact",
  "report",
  "snapshot",
  "history",
  "diff",
  "graph",
];

export async function completionsCommand(shell: string): Promise<void> {
  if (shell === "bash") {
    console.log(
      [
        "_packagelens() {",
        `  local commands=\"${commands.join(" ")}\"`,
        '  COMPREPLY=( $(compgen -W "$commands" -- "${COMP_WORDS[1]}") )',
        "}",
        "complete -F _packagelens packagelens",
      ].join("\n")
    );
    return;
  }
  if (shell === "zsh") {
    console.log(
      `#compdef packagelens\n_arguments '1:command:(${commands.join(" ")})'`
    );
    return;
  }
  throw new DepScopeError("Supported shells: bash, zsh.", "INVALID_ARGUMENT");
}
