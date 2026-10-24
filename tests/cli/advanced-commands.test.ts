import { describe, expect, it } from "vitest";
import { execFileSync } from "node:child_process";
import { resolve } from "node:path";

const fixture = resolve("tests/fixtures/npm-v3");

function run(...args: string[]): string {
  return execFileSync("node", ["dist/index.js", ...args, "--cwd", fixture], {
    encoding: "utf8",
  });
}

describe("CLI advanced commands", () => {
  it("analyzes impact of a package", () => {
    const output = run("impact", "shared");
    expect(output).toContain("Instances:");
    expect(output).toContain("Direct dependents:");
  });

  it("outputs impact as JSON", () => {
    const result = JSON.parse(run("impact", "shared", "--json")) as {
      data: { packageName: string };
    };
    expect(result.data.packageName).toBe("shared");
  });

  it("generates a consolidated report", () => {
    const output = run("report");
    expect(output).toContain("PACKAGELENS REPORT");
    expect(output).toContain("fixture-project");
  });

  it("outputs report as JSON", () => {
    const result = JSON.parse(run("report", "--json")) as { command: string };
    expect(result.command).toBe("report");
  });

  it("validates diff CI thresholds", () => {
    expect(() => run("diff", "--max-added", "-1")).toThrow(
      /--max-added must be a non-negative integer/
    );
  });

  it("runs unused command without crashing", () => {
    const output = run("unused");
    expect(typeof output).toBe("string");
    expect(output.length).toBeGreaterThan(0);
  });

  it("runs size command (no node_modules in fixture)", () => {
    const output = run("size");
    expect(output).toContain("No installed packages found");
  });
});
