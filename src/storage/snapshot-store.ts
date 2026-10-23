import { mkdir, readdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { randomUUID } from "node:crypto";
import { z } from "zod";
import type {
  DependencyGraph,
  Diagnostic,
  ProjectInfo,
} from "../core/models/types.js";

const nodeSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  version: z.string().min(1),
  resolvedVersion: z.string().optional(),
  packagePath: z.string().optional(),
  source: z.enum(["lockfile", "installed", "manifest"]),
  integrity: z.string().optional(),
  isDirect: z.boolean(),
  dependencyKinds: z.array(z.enum(["prod", "dev", "optional", "peer"])),
  isOptional: z.boolean().optional(),
  isDevOnly: z.boolean().optional(),
  isPeer: z.boolean().optional(),
});

const snapshotSchema = z.object({
  schemaVersion: z.literal("1.0.0"),
  id: z.string().uuid(),
  createdAt: z.string().datetime(),
  toolVersion: z.string(),
  project: z.object({
    name: z.string().optional(),
    packageManager: z.string().optional(),
  }),
  graph: z.object({
    nodes: z.array(nodeSchema).max(100_000),
    edges: z
      .array(
        z.object({
          from: z.string(),
          to: z.string(),
          kind: z.enum(["prod", "dev", "optional", "peer"]),
          requestedRange: z.string().optional(),
          isOptional: z.boolean().optional(),
          peerOptional: z.boolean().optional(),
        })
      )
      .max(500_000),
    rootIds: z.array(z.string()),
  }),
  diagnostics: z.array(
    z.object({
      code: z.string(),
      severity: z.enum(["error", "warning", "info"]),
      title: z.string(),
      message: z.string(),
      evidence: z.array(z.string()).optional(),
      recommendation: z.string().optional(),
      confidence: z.enum(["low", "medium", "high"]).optional(),
    })
  ),
  complete: z.boolean(),
});

export type DependencySnapshot = z.infer<typeof snapshotSchema>;

export function snapshotDirectory(projectRoot: string): string {
  return join(projectRoot, ".depscope", "snapshots");
}

export async function saveSnapshot(input: {
  projectRoot: string;
  project: ProjectInfo;
  graph: DependencyGraph;
  diagnostics: Diagnostic[];
  complete: boolean;
  name?: string;
}): Promise<DependencySnapshot> {
  const snapshot: DependencySnapshot = {
    schemaVersion: "1.0.0",
    id: randomUUID(),
    createdAt: new Date().toISOString(),
    toolVersion: "0.1.0",
    project: {
      name: input.project.name,
      packageManager: input.project.packageManager,
    },
    graph: {
      nodes: [...input.graph.nodes.values()],
      edges: input.graph.edges,
      rootIds: input.graph.rootIds,
    },
    diagnostics: input.diagnostics,
    complete: input.complete,
  };
  const directory = snapshotDirectory(input.projectRoot);
  await mkdir(directory, { recursive: true });
  const safeName = input.name?.replace(/[^a-zA-Z0-9_-]/g, "-") || snapshot.id;
  await writeFile(
    join(directory, `${safeName}.json`),
    `${JSON.stringify(snapshot, null, 2)}\n`,
    { encoding: "utf8", flag: "wx" }
  );
  return snapshot;
}

export async function listSnapshots(
  projectRoot: string
): Promise<DependencySnapshot[]> {
  try {
    const directory = snapshotDirectory(projectRoot);
    const files = (await readdir(directory)).filter((file) =>
      file.endsWith(".json")
    );
    const snapshots = await Promise.all(
      files.map((file) => loadSnapshot(join(directory, file)))
    );
    return snapshots.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  } catch (error) {
    if (isMissingDirectory(error)) return [];
    throw error;
  }
}

export async function loadSnapshot(path: string): Promise<DependencySnapshot> {
  const raw: unknown = JSON.parse(await readFile(path, "utf8")) as unknown;
  return snapshotSchema.parse(raw);
}

function isMissingDirectory(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    error.code === "ENOENT"
  );
}
