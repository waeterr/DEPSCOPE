import { readdir, stat } from "node:fs/promises";
import { join } from "node:path";
import type { DependencyGraph } from "../models/types.js";

export interface PackageFootprint {
  name: string;
  version: string;
  nodeModulesPath: string;
  bytes: number;
}

export interface FootprintResult {
  packages: PackageFootprint[];
  totalBytes: number;
  measured: boolean;
}

export async function measureFootprint(
  graph: DependencyGraph,
  projectRoot: string
): Promise<FootprintResult> {
  const packages: PackageFootprint[] = [];

  for (const node of graph.nodes.values()) {
    if (!node.packagePath) continue;
    const fullPath = join(projectRoot, node.packagePath);
    try {
      const bytes = await dirSize(fullPath);
      packages.push({
        name: node.name,
        version: node.version,
        nodeModulesPath: node.packagePath,
        bytes,
      });
    } catch {}
  }

  packages.sort((a, b) => b.bytes - a.bytes);
  const totalBytes = packages.reduce((sum, pkg) => sum + pkg.bytes, 0);
  return { packages, totalBytes, measured: true };
}

async function dirSize(dirPath: string): Promise<number> {
  let total = 0;
  const entries = await readdir(dirPath, { withFileTypes: true });
  for (const entry of entries) {
    const full = join(dirPath, entry.name);
    if (entry.isDirectory()) {
      total += await dirSize(full);
    } else if (entry.isFile() || entry.isSymbolicLink()) {
      try {
        const info = await stat(full);
        total += info.size;
      } catch {}
    }
  }
  return total;
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}
