import { defineConfig } from "tsup";

export default defineConfig({
  entry: {
    cli: "src/cli.ts",
    index: "src/index.ts",
    core: "src/core.ts",
  },
  format: ["esm"],
  target: "node18",
  clean: true,
  dts: true,
  shims: true,
});
