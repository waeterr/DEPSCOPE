import { describe, expect, it } from "vitest";
import { resolve } from "node:path";
import { readManifest } from "../../src/project/manifest-reader.js";
import { readNpmGraph } from "../../src/package-managers/npm/lockfile-parser.js";

const fixture = resolve("tests/fixtures/npm-v3");

describe("npm lockfile parser", () => {
  it("normalizes npm v3 packages and relationships", async () => {
    const graph = await readNpmGraph(fixture, await readManifest(fixture));

    expect(graph.lockfileVersion).toBe(3);
    expect(graph.graph.nodes).toHaveLength(4);
    expect(graph.graph.rootIds).toEqual([
      "node_modules/alpha",
      "node_modules/beta",
    ]);
    expect(graph.graph.nodes.get("node_modules/alpha")).toMatchObject({
      name: "alpha",
      version: "1.0.0",
      isDirect: true,
      dependencyKinds: ["prod"],
    });
    expect(graph.graph.edges).toEqual([
      {
        from: "node_modules/alpha",
        to: "node_modules/shared",
        kind: "prod",
        requestedRange: "^1.0.0",
      },
      {
        from: "node_modules/beta",
        to: "node_modules/beta/node_modules/shared",
        kind: "prod",
        requestedRange: "^2.0.0",
      },
    ]);
  });
});
