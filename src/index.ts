import { loadConfig, type ResolvedConfig, type UserConfig } from "./config.js";
import { fetchSpec } from "./fetcher.js";
import { parseSpec } from "./parser.js";
import { writeOutput, type WriteResult } from "./writer.js";

export type { UserConfig, ResolvedConfig } from "./config.js";
export type { ParsedSpec, ControllerIR, OperationIR } from "./types.js";

/** Run the full pipeline using an already-resolved config. */
export async function generate(config: ResolvedConfig): Promise<WriteResult> {
  const doc = await fetchSpec(config.url);
  const spec = parseSpec(doc);
  return writeOutput(spec, config);
}

/** Load `swagger-tanstack-builder.config.json` from `cwd` and run. */
export async function generateFromConfig(cwd: string = process.cwd()): Promise<WriteResult> {
  const config = await loadConfig(cwd);
  return generate(config);
}
