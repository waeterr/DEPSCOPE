import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { parse } from "yaml";
import type {
  DependencyEdge,
  DependencyKind,
  DependencyNode,
} from "../../core/models/types.js";
import { DepScopeError } from "../../utils/errors.js";
import type { ProjectManifest } from "../../project/manifest-schema.js";
import type { NpmGraphResult } from "../npm/lockfile-parser.js";

export async function readPnpmGraph(
  projectRoot: string,
  manifest: ProjectManifest
): Promise<NpmGraphResult> {
  let raw: unknown;
  try {
    raw = parse(await readFile(resolve(projectRoot, "pnpm-lock.yaml"), "utf8"));
  } catch {
    throw new DepScopeError("Could not parse pnpm-lock.yaml.", "INVALID_LOCKFILE");
  }
  if (
    !isRecord(raw) ||
    (typeof raw.lockfileVersion !== "string" &&
      typeof raw.lockfileVersion !== "number")
  ) {
    throw new DepScopeError("Invalid pnpm-lock.yaml structure.", "INVALID_LOCKFILE");
  }
  const packages = isRecord(raw.packages) ? raw.packages : {};
  const nodes = new Map<string, DependencyNode>();
  const edges: DependencyEdge[] = [];
  const rootIds: string[] = [];
  const idsByName = new Map<string, string[]>();

  for (const key of Object.keys(packages)) {
    const parsed = packageFromKey(key);
    if (!parsed) continue;
    const kinds = directKinds(parsed.name, manifest);
    const node: DependencyNode = {
      id: key,
      name: parsed.name,
      version: parsed.version,
      packagePath: key,
      source: "lockfile",
      isDirect: kinds.length > 0,
      dependencyKinds: kinds.length > 0 ? kinds : ["prod"],
    };
    nodes.set(key, node);
    idsByName.set(parsed.name, [...(idsByName.get(parsed.name) ?? []), key]);
    if (node.isDirect) rootIds.push(key);
  }
  for (const [key, record] of Object.entries(packages)) {
    if (!nodes.has(key) || !isRecord(record)) continue;
    for (const dependencies of [record.dependencies, record.optionalDependencies]) {
      if (!isRecord(dependencies)) continue;
      for (const [name, specifier] of Object.entries(dependencies)) {
        const target = (idsByName.get(name) ?? []).find((id) =>
          id.endsWith(`@${dependencyVersion(specifier)}`)
        );
        if (target) edges.push({ from: key, to: target, kind: "prod" });
      }
    }
  }
  return {
    graph: { nodes, edges, rootIds },
    lockfileVersion: raw.lockfileVersion,
    complete: true,
    limitations: ["Peer dependency resolution is not represented in pnpm graph output."],
  };
}

function packageFromKey(key: string): { name: string; version: string } | undefined {
  const normalized = key.replace(/^\//, "").split("(")[0] ?? "";
  const at = normalized.lastIndexOf("@");
  if (at <= 0) return undefined;
  return { name: normalized.slice(0, at), version: normalized.slice(at + 1) };
}

function dependencyVersion(value: unknown): string {
  if (typeof value === "string") return value.replace(/^npm:/, "");
  if (isRecord(value) && typeof value.version === "string") return value.version;
  return "";
}

function directKinds(name: string, manifest: ProjectManifest): DependencyKind[] {
  const result: DependencyKind[] = [];
  if (manifest.dependencies?.[name]) result.push("prod");
  if (manifest.devDependencies?.[name]) result.push("dev");
  if (manifest.optionalDependencies?.[name]) result.push("optional");
  if (manifest.peerDependencies?.[name]) result.push("peer");
  return result;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
