import { describe, expect, it } from "vitest";
import { execFileSync } from "node:child_process";
import { resolve } from "node:path";

const fixture = resolve("tests/fixtures/npm-v3");

function run(...args: string[]): string {
  return execFileSync("node", ["dist/index.js", ...args, "--cwd", fixture], {
    encoding: "utf8",
  });
}

describe("CLI analysis commands", () => {
  it("scans a project", () => {
    expect(run("scan")).toContain("Project: fixture-project");
  });

  it("outputs JSON without decorative stdout", () => {
    const result = JSON.parse(run("stats", "--json")) as {
      data: { totalResolvedInstances: number };
    };
    expect(result.data.totalResolvedInstances).toBe(4);
  });

  it("renders a dependency tree", () => {
    expect(run("tree")).toContain("alpha@1.0.0");
  });

  it("explains why a package exists", () => {
    expect(run("why", "shared")).toContain("shared@1.0.0");
  });

  it("lists reverse dependencies", () => {
    expect(run("dependents", "shared")).toContain("alpha@1.0.0");
  });

  it("finds duplicate versions", () => {
    expect(run("duplicates")).toContain("shared");
  });

  it("runs doctor", () => {
    expect(run("doctor")).toContain("No diagnostics found.");
  });
});
