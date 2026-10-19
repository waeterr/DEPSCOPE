import { describe, it, expect } from "vitest";
import { execSync } from "child_process";

describe("CLI Unsupported Commands", () => {
  const commands = ["scan", "tree", "stats", "duplicates", "doctor"];

  commands.forEach((cmd) => {
    it(`should report ${cmd} as not implemented`, () => {
      try {
        execSync(`node dist/index.js ${cmd}`, {
          encoding: "utf-8",
          cwd: process.cwd(),
          stdio: "pipe",
        });
      } catch (error: any) {
        const stderr = error.stderr || error.stdout || "";
        expect(stderr).toContain("not yet implemented");
        expect(stderr).toContain(cmd);
        expect(error.status).toBe(1);
      }
    });
  });

  it("should report why command as not implemented", () => {
    try {
      execSync("node dist/index.js why lodash", {
        encoding: "utf-8",
        cwd: process.cwd(),
        stdio: "pipe",
      });
    } catch (error: any) {
      const stderr = error.stderr || error.stdout || "";
      expect(stderr).toContain("not yet implemented");
      expect(error.status).toBe(1);
    }
  });

  it("should report dependents command as not implemented", () => {
    try {
      execSync("node dist/index.js dependents lodash", {
        encoding: "utf-8",
        cwd: process.cwd(),
        stdio: "pipe",
      });
    } catch (error: any) {
      const stderr = error.stderr || error.stdout || "";
      expect(stderr).toContain("not yet implemented");
      expect(error.status).toBe(1);
    }
  });
});
