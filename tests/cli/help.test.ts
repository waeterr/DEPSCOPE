import { describe, it, expect } from "vitest";
import { execSync } from "child_process";

describe("CLI Help", () => {
  it("should display help with --help flag", () => {
    const output = execSync("node dist/index.js --help", {
      encoding: "utf-8",
      cwd: process.cwd(),
    });
    expect(output).toContain("packagelens");
    expect(output).toContain("Usage:");
  });

  it("should display help with -h flag", () => {
    const output = execSync("node dist/index.js -h", {
      encoding: "utf-8",
      cwd: process.cwd(),
    });
    expect(output).toContain("packagelens");
  });

  it("should display overview when no arguments", () => {
    const output = execSync("node dist/index.js", {
      encoding: "utf-8",
      cwd: process.cwd(),
    });
    expect(output).toContain("PACKAGELENS");
    expect(output).toContain("Understand What Your Dependencies Are Doing");
    expect(output).toContain("scan");
    expect(output).toContain("tree");
  });
});
