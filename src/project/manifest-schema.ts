import { z } from "zod";

const dependencyMapSchema = z.record(z.string());

export const manifestSchema = z
  .object({
    name: z.string().optional(),
    version: z.string().optional(),
    packageManager: z.string().optional(),
    workspaces: z
      .union([z.array(z.string()), z.object({ packages: z.array(z.string()) })])
      .optional(),
    dependencies: dependencyMapSchema.optional(),
    devDependencies: dependencyMapSchema.optional(),
    optionalDependencies: dependencyMapSchema.optional(),
    peerDependencies: dependencyMapSchema.optional(),
  })
  .passthrough();

export type ProjectManifest = z.infer<typeof manifestSchema>;
