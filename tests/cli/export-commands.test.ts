import { describe, expect, it } from "vitest";
import { execFileSync } from "node:child_process";
import { resolve } from "node:path";

const fixture = resolve("tests/fixtures/npm-v3");

function run(...args: string[]): string {
  return execFileSync("node", ["dist/index.js", ...args, "--cwd", fixture], {
    encoding: "utf8",
  });
}

describe("CLI export commands", () => {
  it("exports a graph as JSON", () => {
    const result = JSON.parse(run("graph", "--json")) as {
      data: { nodes: unknown[]; edges: unknown[] };
    };
    expect(result.data.nodes).toHaveLength(4);
    expect(result.data.edges).toHaveLength(2);
  });

  it("exports a graph as DOT", () => {
    const output = run("graph", "--format", "dot");
    expect(output).toContain("digraph depscope");
    expect(output).toContain("node_modules/alpha");
  });

  it("generates bash completions", () => {
    const output = execFileSync(
      "node",
      ["dist/index.js", "completions", "bash"],
      { encoding: "utf8" }
    );
    expect(output).toContain("complete -F _depscope depscope");
  });
});
