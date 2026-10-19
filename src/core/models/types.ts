export interface GlobalOptions {
  cwd?: string;
  json?: boolean;
  quiet?: boolean;
  verbose?: boolean;
  noColor?: boolean;
}

export interface ProjectInfo {
  name?: string;
  version?: string;
  rootPath: string;
  packageManager?: string;
  packageManagerVersion?: string;
  lockfilePath?: string;
  lockfileVersion?: number | string;
  isWorkspace: boolean;
  analysisTimestamp: string;
}

export type DependencyKind = "prod" | "dev" | "optional" | "peer";

export interface DependencyNode {
  id: string;
  name: string;
  version: string;
  resolvedVersion?: string;
  packagePath?: string;
  source: "lockfile" | "installed" | "manifest";
  integrity?: string;
  isDirect: boolean;
  dependencyKinds: DependencyKind[];
  isOptional?: boolean;
  isDevOnly?: boolean;
  isPeer?: boolean;
}

export interface DependencyEdge {
  from: string;
  to: string;
  kind: DependencyKind;
  requestedRange?: string;
  isOptional?: boolean;
  peerOptional?: boolean;
}

export interface DependencyGraph {
  nodes: Map<string, DependencyNode>;
  edges: DependencyEdge[];
  rootIds: string[];
}

export type DiagnosticSeverity = "error" | "warning" | "info";

export interface Diagnostic {
  code: string;
  severity: DiagnosticSeverity;
  title: string;
  message: string;
  evidence?: string[];
  recommendation?: string;
  confidence?: "low" | "medium" | "high";
}
