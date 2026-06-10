import type { CodegenConfig } from "./config.js";
import type { ParsedSpec } from "./types.js";
import {
  generateApis,
  generateIndex,
  generateMutations,
  generateQueries,
  generateTypes,
} from "./generators.js";

/** One generated file, addressed by its path relative to the output directory. */
export interface GeneratedFile {
  /** e.g. `contact/apis.ts` */
  path: string;
  /** File contents, unformatted (the caller decides whether to run Prettier). */
  content: string;
}

/**
 * Produce every generated file as an in-memory string. Pure and environment-free:
 * no filesystem, no formatting — so it runs identically in Node and the browser.
 */
export function generateFiles(spec: ParsedSpec, config: CodegenConfig): GeneratedFile[] {
  const out: GeneratedFile[] = [];

  for (const controller of spec.controllers) {
    const files: Record<string, string> = {
      "types.ts": generateTypes(controller),
      "apis.ts": generateApis(controller, config),
      "queries.ts": generateQueries(controller, config),
      "mutations.ts": generateMutations(controller, config),
      "index.ts": generateIndex(),
    };

    for (const [filename, content] of Object.entries(files)) {
      out.push({ path: `${controller.dirName}/${filename}`, content });
    }
  }

  return out;
}
