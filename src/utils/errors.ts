export class DepScopeError extends Error {
  public readonly code: string;
  public readonly exitCode: number;

  constructor(message: string, code: string, exitCode: number = 1) {
    super(message);
    this.name = "DepScopeError";
    this.code = code;
    this.exitCode = exitCode;
  }
}

export class ProjectNotFoundError extends DepScopeError {
  constructor(path: string) {
    super(
      `Project not found at: ${path}\n\nEnsure the directory contains a package.json file.`,
      "PROJECT_NOT_FOUND",
      1
    );
  }
}

export class UnsupportedFeatureError extends DepScopeError {
  constructor(feature: string) {
    super(
      `Feature not yet implemented: ${feature}\n\nThis command will be available in a future release.`,
      "UNSUPPORTED_FEATURE",
      1
    );
  }
}
