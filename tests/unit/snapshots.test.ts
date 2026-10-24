import { describe, expect, it } from "vitest";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  listSnapshots,
  saveSnapshot,
} from "../../src/storage/snapshot-store.js";
import { diffSnapshots } from "../../src/core/analyzer/snapshot-diff.js";

function graph(version: string) {
  return {
    nodes: new Map([
      [
        "alpha",
        {
          id: "alpha",
          name: "alpha",
          version,
          source: "lockfile" as const,
          isDirect: true,
          dependencyKinds: ["prod" as const],
        },
      ],
    ]),
    edges: [],
    rootIds: ["alpha"],
  };
}

describe("snapshots", () => {
  it("saves, lists, and compares snapshots", async () => {
    const root = await mkdtemp(join(tmpdir(), "packagelens-snapshot-"));
    try {
      const first = await saveSnapshot({
        projectRoot: root,
        project: {
          rootPath: root,
          isWorkspace: false,
          analysisTimestamp: new Date().toISOString(),
        },
        graph: graph("1.0.0"),
        diagnostics: [],
        complete: true,
        name: "before",
      });
      const second = await saveSnapshot({
        projectRoot: root,
        project: {
          rootPath: root,
          isWorkspace: false,
          analysisTimestamp: new Date().toISOString(),
        },
        graph: graph("2.0.0"),
        diagnostics: [],
        complete: true,
        name: "after",
      });
      expect(await listSnapshots(root)).toHaveLength(2);
      expect(diffSnapshots(first, second)).toMatchObject({
        added: ["alpha@2.0.0"],
        removed: ["alpha@1.0.0"],
        versionChanges: [{ name: "alpha", from: ["1.0.0"], to: ["2.0.0"] }],
      });
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  });
});
