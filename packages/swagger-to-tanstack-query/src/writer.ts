import { mkdir, rm, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import type { ResolvedConfig } from "./config.js";
import type { ParsedSpec } from "./types.js";
import { generateFiles } from "./build-files.js";
import { format } from "./format.js";

export type { GeneratedFile } from "./build-files.js";
export { generateFiles } from "./build-files.js";

export interface WriteResult {
  controllers: number;
  files: number;
}

export async function writeOutput(
  spec: ParsedSpec,
  config: ResolvedConfig,
): Promise<WriteResult> {
  // Fresh output: remove the previous generation so deletions propagate.
  await rm(config.outputDir, { recursive: true, force: true });
  await mkdir(config.outputDir, { recursive: true });

  const files = generateFiles(spec, config);

  for (const file of files) {
    const abs = join(config.outputDir, file.path);
    await mkdir(dirname(abs), { recursive: true });
    const content = config.format ? await format(file.content) : file.content;
    await writeFile(abs, content, "utf-8");
  }

  return { controllers: spec.controllers.length, files: files.length };
}
