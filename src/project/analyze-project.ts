import type { Diagnostic, ProjectInfo } from "../core/models/types.js";
import { discoverProject } from "./discovery.js";
import { readManifest } from "./manifest-reader.js";
import { detectWorkspaces, type WorkspaceInfo } from "./workspace-detection.js";
import {
  readNpmGraph,
  type NpmGraphResult,
} from "../package-managers/npm/lockfile-parser.js";

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
      message: `Found npm and ${discovery.conflictingLockfiles.join(", ")} lockfiles. npm package-lock.json was selected.`,
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
    packageManager: "npm",
    ...(discovery.lockfilePath ? { lockfilePath: "package-lock.json" } : {}),
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

  const graph = await readNpmGraph(discovery.rootPath, manifest);
  project.lockfileVersion = graph.lockfileVersion;
  return { project, diagnostics, graph, ...(workspace ? { workspace } : {}) };
}
