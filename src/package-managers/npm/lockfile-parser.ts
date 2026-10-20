import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { z } from "zod";
import type {
  DependencyEdge,
  DependencyGraph,
  DependencyKind,
  DependencyNode,
} from "../../core/models/types.js";
import { DepScopeError } from "../../utils/errors.js";
import type { ProjectManifest } from "../../project/manifest-schema.js";

const lockfileSchema = z.object({
  lockfileVersion: z.union([z.number(), z.string()]),
  packages: z.record(z.unknown()).optional(),
});

type LockPackage = {
  version?: unknown;
  resolved?: unknown;
  integrity?: unknown;
  dependencies?: unknown;
  dev?: unknown;
  optional?: unknown;
  peer?: unknown;
};

export interface NpmGraphResult {
  graph: DependencyGraph;
  lockfileVersion: number | string;
  complete: boolean;
  limitations: string[];
}

export async function readNpmGraph(
  projectRoot: string,
  manifest: ProjectManifest
): Promise<NpmGraphResult> {
  const path = resolve(projectRoot, "package-lock.json");
  let raw: unknown;
  try {
    raw = JSON.parse(await readFile(path, "utf8")) as unknown;
  } catch (error) {
    if (error instanceof SyntaxError) {
      throw new DepScopeError(
        "Could not parse package-lock.json.\n\nThe file is not valid JSON.",
        "INVALID_LOCKFILE"
      );
    }
    throw new DepScopeError(
      "Could not read package-lock.json.",
      "LOCKFILE_READ_FAILED"
    );
  }

  const lockfile = lockfileSchema.safeParse(raw);
  if (!lockfile.success)
    throw new DepScopeError(
      "Invalid package-lock.json structure.",
      "INVALID_LOCKFILE"
    );
  if (!lockfile.data.packages) {
    throw new DepScopeError(
      `package-lock.json version ${lockfile.data.lockfileVersion} is unsupported. Only npm lockfile v2 and v3 are currently supported.`,
      "UNSUPPORTED_LOCKFILE"
    );
  }

  const nodes = new Map<string, DependencyNode>();
  const edges: DependencyEdge[] = [];
  const rootIds: string[] = [];
  const packages = lockfile.data.packages;

  for (const [packagePath, record] of Object.entries(packages)) {
    if (packagePath === "") continue;
    const data = record as LockPackage;
    if (typeof data.version !== "string") continue;
    const name = nameFromPath(packagePath);
    if (!name) continue;
    const id = packagePath;
    const kinds = directKinds(name, manifest);
    const node: DependencyNode = {
      id,
      name,
      version: data.version,
      ...(typeof data.resolved === "string"
        ? { resolvedVersion: data.resolved }
        : {}),
      packagePath,
      source: "lockfile",
      ...(typeof data.integrity === "string"
        ? { integrity: data.integrity }
        : {}),
      isDirect: kinds.length > 0,
      dependencyKinds: kinds.length > 0 ? kinds : [kindFromRecord(data)],
      ...(data.optional === true ? { isOptional: true } : {}),
      ...(data.dev === true ? { isDevOnly: true } : {}),
      ...(data.peer === true ? { isPeer: true } : {}),
    };
    nodes.set(id, node);
    if (node.isDirect) rootIds.push(id);
  }

  for (const [packagePath, record] of Object.entries(packages)) {
    if (!nodes.has(packagePath)) continue;
    const dependencies = (record as LockPackage).dependencies;
    if (!isStringRecord(dependencies)) continue;
    for (const [name, requestedRange] of Object.entries(dependencies)) {
      const target = resolveDependencyPath(packagePath, name, nodes);
      if (target)
        edges.push({
          from: packagePath,
          to: target,
          kind: "prod",
          requestedRange,
        });
    }
  }

  return {
    graph: { nodes, edges, rootIds },
    lockfileVersion: lockfile.data.lockfileVersion,
    complete: true,
    limitations: [],
  };
}

function nameFromPath(packagePath: string): string | undefined {
  const marker = "node_modules/";
  const index = packagePath.lastIndexOf(marker);
  return index === -1 ? undefined : packagePath.slice(index + marker.length);
}

function resolveDependencyPath(
  from: string,
  name: string,
  nodes: Map<string, DependencyNode>
): string | undefined {
  let parent = from;
  while (true) {
    const candidate = `${parent}/node_modules/${name}`;
    if (nodes.has(candidate)) return candidate;
    const index = parent.lastIndexOf("/node_modules/");
    if (index === -1) break;
    parent = parent.slice(0, index);
  }
  return nodes.has(`node_modules/${name}`) ? `node_modules/${name}` : undefined;
}

function directKinds(
  name: string,
  manifest: ProjectManifest
): DependencyKind[] {
  const result: DependencyKind[] = [];
  if (manifest.dependencies?.[name]) result.push("prod");
  if (manifest.devDependencies?.[name]) result.push("dev");
  if (manifest.optionalDependencies?.[name]) result.push("optional");
  if (manifest.peerDependencies?.[name]) result.push("peer");
  return result;
}

function kindFromRecord(record: LockPackage): DependencyKind {
  if (record.peer === true) return "peer";
  if (record.optional === true) return "optional";
  return record.dev === true ? "dev" : "prod";
}

function isStringRecord(value: unknown): value is Record<string, string> {
  return (
    typeof value === "object" &&
    value !== null &&
    Object.values(value).every((entry) => typeof entry === "string")
  );
}
