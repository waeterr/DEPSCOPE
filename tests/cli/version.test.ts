import { describe, it, expect } from "vitest";
import { execSync } from "child_process";

describe("CLI Version", () => {
  it("should display version with --version flag", () => {
    const output = execSync("node dist/index.js --version", {
      encoding: "utf-8",
      cwd: process.cwd(),
    });
    expect(output).toMatch(/\d+\.\d+\.\d+/);
  });

  it("should display version with -v flag", () => {
    const output = execSync("node dist/index.js -v", {
      encoding: "utf-8",
      cwd: process.cwd(),
    });
    expect(output).toMatch(/\d+\.\d+\.\d+/);
  });
});
