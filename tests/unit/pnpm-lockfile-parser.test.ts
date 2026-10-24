import { describe, expect, it } from "vitest";
import { resolve } from "node:path";
import { readManifest } from "../../src/project/manifest-reader.js";
import { readPnpmGraph } from "../../src/package-managers/pnpm/lockfile-parser.js";

describe("pnpm lockfile parser", () => {
  it("parses pnpm v9 packages and edges", async () => {
    const root = resolve("tests/fixtures/pnpm-v9");
    const graph = await readPnpmGraph(root, await readManifest(root));
    expect(graph.graph.nodes).toHaveLength(2);
    expect(graph.graph.rootIds).toEqual(["alpha@1.0.0"]);
    expect(graph.graph.edges).toEqual([
      expect.objectContaining({ from: "alpha@1.0.0", to: "shared@1.0.0" }),
    ]);
  });
});
