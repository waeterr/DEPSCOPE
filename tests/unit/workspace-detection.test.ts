import { describe, expect, it } from "vitest";
import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { readManifest } from "../../src/project/manifest-reader.js";
import { detectWorkspaces } from "../../src/project/workspace-detection.js";

const manifest = JSON.stringify({
  name: "monorepo",
  workspaces: ["packages/*"],
});

describe("workspace detection", () => {
  it("detects package directories from wildcard workspaces", async () => {
    const root = await mkdtemp(join(tmpdir(), "packagelens-workspace-"));
    try {
      await mkdir(join(root, "packages", "alpha"), { recursive: true });
      await mkdir(join(root, "packages", "beta"), { recursive: true });
      await mkdir(join(root, "packages", "ignored"), { recursive: true });
      await writeFile(join(root, "package.json"), manifest);
      await writeFile(
        join(root, "packages", "alpha", "package.json"),
        '{"name":"alpha"}'
      );
      await writeFile(
        join(root, "packages", "beta", "package.json"),
        '{"name":"beta"}'
      );

      expect(await detectWorkspaces(root, await readManifest(root))).toEqual({
        patterns: ["packages/*"],
        packagePaths: ["packages/alpha", "packages/beta"],
      });
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  });
});
