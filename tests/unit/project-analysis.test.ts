import { describe, expect, it } from "vitest";
import { mkdtemp, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { analyzeProject } from "../../src/project/analyze-project.js";

async function temporaryProject(
  files: Record<string, string>
): Promise<string> {
  const root = await mkdtemp(join(tmpdir(), "packagelens-"));
  await Promise.all(
    Object.entries(files).map(([name, content]) =>
      writeFile(join(root, name), content)
    )
  );
  return root;
}

describe("project analysis", () => {
  it("reports a missing lockfile as limited analysis", async () => {
    const root = await temporaryProject({
      "package.json": '{"name":"no-lock","dependencies":{"alpha":"^1.0.0"}}',
    });

    const result = await analyzeProject(root);

    expect(result.graph).toBeUndefined();
    expect(result.diagnostics).toMatchObject([{ code: "MISSING_LOCKFILE" }]);
  });

  it("reports conflicting lockfiles", async () => {
    const root = await temporaryProject({
      "package.json": '{"name":"conflict"}',
      "package-lock.json": '{"lockfileVersion":3,"packages":{}}',
      "yarn.lock": "# yarn lockfile v1",
    });

    const result = await analyzeProject(root);

    expect(result.diagnostics).toMatchObject([
      { code: "CONFLICTING_LOCKFILES" },
    ]);
  });

  it("rejects invalid manifest JSON", async () => {
    const root = await temporaryProject({ "package.json": "{" });

    await expect(analyzeProject(root)).rejects.toMatchObject({
      code: "INVALID_MANIFEST",
    });
  });
});
