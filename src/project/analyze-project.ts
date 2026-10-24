import type { Diagnostic, ProjectInfo } from "../core/models/types.js";
import { discoverProject } from "./discovery.js";
import { readManifest } from "./manifest-reader.js";
import { detectWorkspaces, type WorkspaceInfo } from "./workspace-detection.js";
import {
  readNpmGraph,
  type NpmGraphResult,
} from "../package-managers/npm/lockfile-parser.js";
import { readPnpmGraph } from "../package-managers/pnpm/lockfile-parser.js";
import { readYarnGraph } from "../package-managers/yarn/lockfile-parser.js";

export interface ProjectAnalysis {
  project: ProjectInfo;
  diagnostics: Diagnostic[];
  graph?: NpmGraphResult;
  workspace?: WorkspaceInfo;
}

export async function analyzeProject(cwd: string): Promise<ProjectAnalysis> {
  const discovery = await discoverProject(cwd);
  const manifest = await readManifest(discovery.rootPath);
  const workspace = await detectWorkspaces(discovery.rootPath, manifest);
  const diagnostics: Diagnostic[] = [];
  const lockfileName = discovery.lockfilePath?.split(/[\\/]/).pop();
  const packageManager =
    lockfileName === "pnpm-lock.yaml"
      ? "pnpm"
      : lockfileName === "yarn.lock"
        ? "yarn"
        : "npm";

  if (workspace) {
    diagnostics.push({
      code: "WORKSPACE_PARTIAL_ANALYSIS",
      severity: "info",
      title: "Workspace detected",
      message: `Detected ${workspace.packagePaths.length} workspace package(s). Analysis currently uses the root npm lockfile.`,
      evidence: workspace.packagePaths,
      confidence: "high",
    });
  }

  if (discovery.conflictingLockfiles.length > 0) {
    diagnostics.push({
      code: "CONFLICTING_LOCKFILES",
      severity: "warning",
      title: "Conflicting package-manager metadata",
      message: `Found multiple lockfiles. ${lockfileName ?? "The first lockfile"} was selected.`,
      evidence: discovery.conflictingLockfiles,
      recommendation:
        "Remove unused lockfiles or select an explicit package manager.",
      confidence: "high",
    });
  }

  const project: ProjectInfo = {
    ...(manifest.name ? { name: manifest.name } : {}),
    ...(manifest.version ? { version: manifest.version } : {}),
    rootPath: discovery.rootPath,
    packageManager,
    ...(lockfileName ? { lockfilePath: lockfileName } : {}),
    isWorkspace: manifest.workspaces !== undefined,
    analysisTimestamp: new Date().toISOString(),
  };

  if (!discovery.lockfilePath) {
    diagnostics.push({
      code: "MISSING_LOCKFILE",
      severity: "warning",
      title: "No supported lockfile found",
      message:
        "Only declared dependencies can be analyzed; the resolved transitive graph is unavailable.",
      recommendation:
        "Use your normal package-manager workflow to create a package-lock.json.",
      confidence: "high",
    });
    return { project, diagnostics, ...(workspace ? { workspace } : {}) };
  }

  const graph =
    packageManager === "pnpm"
      ? await readPnpmGraph(discovery.rootPath, manifest)
      : packageManager === "yarn"
        ? await readYarnGraph(discovery.rootPath, manifest)
        : await readNpmGraph(discovery.rootPath, manifest);
  project.lockfileVersion = graph.lockfileVersion;
  return { project, diagnostics, graph, ...(workspace ? { workspace } : {}) };
}
