import { describe, expect, it } from "vitest";
import { resolve } from "node:path";
import { readManifest } from "../../src/project/manifest-reader.js";
import { readYarnGraph } from "../../src/package-managers/yarn/lockfile-parser.js";

describe("Yarn Classic lockfile parser", () => {
  it("parses packages and edges", async () => {
    const root = resolve("tests/fixtures/yarn-v1");
    const graph = await readYarnGraph(root, await readManifest(root));
    expect(graph.graph.nodes).toHaveLength(2);
    expect(graph.graph.rootIds).toEqual(["alpha@1.0.0"]);
    expect(graph.graph.edges).toEqual([
      expect.objectContaining({ from: "alpha@1.0.0", to: "shared@1.0.0" }),
    ]);
  });
});
