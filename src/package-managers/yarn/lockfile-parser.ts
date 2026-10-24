import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import type {
  DependencyEdge,
  DependencyKind,
  DependencyNode,
} from "../../core/models/types.js";
import { DepScopeError } from "../../utils/errors.js";
import type { ProjectManifest } from "../../project/manifest-schema.js";
import type { NpmGraphResult } from "../npm/lockfile-parser.js";

type LockEntry = { selectors: string[]; version?: string; dependencies: string[] };

export async function readYarnGraph(
  projectRoot: string,
  manifest: ProjectManifest
): Promise<NpmGraphResult> {
  let source: string;
  try {
    source = await readFile(resolve(projectRoot, "yarn.lock"), "utf8");
  } catch {
    throw new DepScopeError("Could not read yarn.lock.", "LOCKFILE_READ_FAILED");
  }
  const entries = parseYarnLock(source);
  if (entries.length === 0) {
    throw new DepScopeError(
      "Unsupported or empty yarn.lock. Only Yarn Classic v1 lockfiles are supported.",
      "UNSUPPORTED_LOCKFILE"
    );
  }
  const nodes = new Map<string, DependencyNode>();
  const edges: DependencyEdge[] = [];
  const rootIds: string[] = [];
  const idsByName = new Map<string, string[]>();
  for (const entry of entries) {
    if (!entry.version) continue;
    const name = nameFromSelector(entry.selectors[0] ?? "");
    if (!name) continue;
    const id = `${name}@${entry.version}`;
    if (nodes.has(id)) continue;
    const kinds = directKinds(name, manifest);
    nodes.set(id, {
      id,
      name,
      version: entry.version,
      packagePath: id,
      source: "lockfile",
      isDirect: kinds.length > 0,
      dependencyKinds: kinds.length > 0 ? kinds : ["prod"],
    });
    idsByName.set(name, [...(idsByName.get(name) ?? []), id]);
    if (kinds.length > 0) rootIds.push(id);
  }
  for (const entry of entries) {
    const fromName = nameFromSelector(entry.selectors[0] ?? "");
    if (!fromName || !entry.version) continue;
    const from = `${fromName}@${entry.version}`;
    if (!nodes.has(from)) continue;
    for (const dependency of entry.dependencies) {
      const name = dependency.split(/\s+/)[0] ?? "";
      const target = idsByName.get(name)?.[0];
      if (target) edges.push({ from, to: target, kind: "prod" });
    }
  }
  return {
    graph: { nodes, edges, rootIds },
    lockfileVersion: 1,
    complete: true,
    limitations: ["Only Yarn Classic v1 lockfiles are supported."],
  };
}

function parseYarnLock(source: string): LockEntry[] {
  const entries: LockEntry[] = [];
  let current: LockEntry | undefined;
  for (const line of source.split(/\r?\n/)) {
    if (!line || line.startsWith("#")) continue;
    if (!line.startsWith(" ") && line.endsWith(":")) {
      current = {
        selectors: line.slice(0, -1).split(", ").map(unquote),
        dependencies: [],
      };
      entries.push(current);
      continue;
    }
    if (!current) continue;
    const version = /^  version "(.+)"$/.exec(line);
    if (version?.[1]) current.version = version[1];
    const dependency = /^    (\S+) (.+)$/.exec(line);
    if (dependency?.[1] && dependency[2]) {
      current.dependencies.push(`${dependency[1]} ${unquote(dependency[2])}`);
    }
  }
  return entries;
}

function nameFromSelector(selector: string): string | undefined {
  const index = selector.startsWith("@")
    ? selector.indexOf("@", 1)
    : selector.indexOf("@");
  return index > 0 ? selector.slice(0, index) : undefined;
}

function directKinds(name: string, manifest: ProjectManifest): DependencyKind[] {
  const result: DependencyKind[] = [];
  if (manifest.dependencies?.[name]) result.push("prod");
  if (manifest.devDependencies?.[name]) result.push("dev");
  if (manifest.optionalDependencies?.[name]) result.push("optional");
  if (manifest.peerDependencies?.[name]) result.push("peer");
  return result;
}

function unquote(value: string): string {
  return value.replace(/^"|"$/g, "");
}
