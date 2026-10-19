import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/cli/index.ts"],
  format: ["esm"],
  target: "es2022",
  outDir: "dist",
  clean: true,
  minify: false,
  sourcemap: true,
  dts: false,
  shims: true,
  banner: {
    js: "#!/usr/bin/env node",
  },
});
