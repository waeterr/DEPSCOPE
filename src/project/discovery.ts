import { access, stat } from "node:fs/promises";
import { resolve } from "node:path";
import { ProjectNotFoundError } from "../utils/errors.js";

export interface ProjectDiscovery {
  rootPath: string;
  manifestPath: string;
  lockfilePath?: string;
  installedLockfilePath?: string;
  hasNodeModules: boolean;
  conflictingLockfiles: string[];
}

export async function discoverProject(path: string): Promise<ProjectDiscovery> {
  const rootPath = resolve(path);
  const manifestPath = resolve(rootPath, "package.json");

  try {
    if (!(await stat(rootPath)).isDirectory()) throw new Error();
    await access(manifestPath);
  } catch {
    throw new ProjectNotFoundError(rootPath);
  }

  const lockfiles = ["package-lock.json", "pnpm-lock.yaml", "yarn.lock"];
  const found = await Promise.all(
    lockfiles.map(async (file) =>
      (await exists(resolve(rootPath, file))) ? file : undefined
    )
  );
  const present = found.filter((file): file is string => file !== undefined);

  return {
    rootPath,
    manifestPath,
    ...(present.includes("package-lock.json")
      ? { lockfilePath: resolve(rootPath, "package-lock.json") }
      : {}),
    ...((await exists(resolve(rootPath, "node_modules/.package-lock.json")))
      ? {
          installedLockfilePath: resolve(
            rootPath,
            "node_modules/.package-lock.json"
          ),
        }
      : {}),
    hasNodeModules: await exists(resolve(rootPath, "node_modules")),
    conflictingLockfiles: present.filter(
      (file) => file !== "package-lock.json"
    ),
  };
}

async function exists(path: string): Promise<boolean> {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}
