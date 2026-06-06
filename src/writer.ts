import { mkdir, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";
import type { ResolvedConfig } from "./config.js";
import type { ParsedSpec } from "./types.js";
import {
  generateApis,
  generateIndex,
  generateMutations,
  generateQueries,
  generateTypes,
} from "./generators.js";
import { format } from "./format.js";

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

  let fileCount = 0;

  for (const controller of spec.controllers) {
    const dir = join(config.outputDir, controller.dirName);
    await mkdir(dir, { recursive: true });

    const files: Record<string, string> = {
      "types.ts": generateTypes(controller),
      "apis.ts": generateApis(controller, config),
      "queries.ts": generateQueries(controller),
      "mutations.ts": generateMutations(controller),
      "index.ts": generateIndex(),
    };

    for (const [filename, content] of Object.entries(files)) {
      const formatted = config.format ? await format(content) : content;
      await writeFile(join(dir, filename), formatted, "utf-8");
      fileCount++;
    }
  }

  return { controllers: spec.controllers.length, files: fileCount };
}
