import { readdir, stat } from "node:fs/promises";
import { join, relative, sep } from "node:path";
import type { ProjectManifest } from "./manifest-schema.js";

export interface WorkspaceInfo {
  patterns: string[];
  packagePaths: string[];
}

export async function detectWorkspaces(
  projectRoot: string,
  manifest: ProjectManifest
): Promise<WorkspaceInfo | undefined> {
  const patterns = workspacePatterns(manifest);
  if (patterns.length === 0) return undefined;

  const packagePaths: string[] = [];
  for (const pattern of patterns) {
    if (pattern.endsWith("/*")) {
      const parent = join(projectRoot, pattern.slice(0, -2));
      try {
        for (const entry of await readdir(parent, { withFileTypes: true })) {
          if (!entry.isDirectory()) continue;
          const path = join(parent, entry.name);
          if (await isPackageDirectory(path))
            packagePaths.push(relative(projectRoot, path).replaceAll(sep, "/"));
        }
      } catch {}
    } else {
      const path = join(projectRoot, pattern);
      if (await isPackageDirectory(path)) packagePaths.push(pattern);
    }
  }

  return { patterns, packagePaths: [...new Set(packagePaths)].sort() };
}

function workspacePatterns(manifest: ProjectManifest): string[] {
  if (Array.isArray(manifest.workspaces)) return manifest.workspaces;
  return manifest.workspaces?.packages ?? [];
}

async function isPackageDirectory(path: string): Promise<boolean> {
  try {
    return (await stat(join(path, "package.json"))).isFile();
  } catch {
    return false;
  }
}

export function isWithinProject(projectRoot: string, path: string): boolean {
  const rel = relative(projectRoot, path);
  return rel !== "" && !rel.startsWith(`..${sep}`) && rel !== "..";
}
