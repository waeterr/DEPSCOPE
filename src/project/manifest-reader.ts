import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { ZodError } from "zod";
import { DepScopeError } from "../utils/errors.js";
import { manifestSchema, type ProjectManifest } from "./manifest-schema.js";

export async function readManifest(
  projectRoot: string
): Promise<ProjectManifest> {
  const path = resolve(projectRoot, "package.json");
  let raw: unknown;

  try {
    raw = JSON.parse(await readFile(path, "utf8")) as unknown;
  } catch (error) {
    if (error instanceof SyntaxError) {
      throw new DepScopeError(
        `Could not parse package.json at ${path}.\n\nThe file is not valid JSON.`,
        "INVALID_MANIFEST"
      );
    }
    throw new DepScopeError(
      `Could not read package.json at ${path}.`,
      "MANIFEST_READ_FAILED"
    );
  }

  try {
    return manifestSchema.parse(raw);
  } catch (error) {
    const detail =
      error instanceof ZodError ? error.issues[0]?.message : "Invalid shape.";
    throw new DepScopeError(
      `Invalid package.json at ${path}.\n\n${detail}`,
      "INVALID_MANIFEST"
    );
  }
}
