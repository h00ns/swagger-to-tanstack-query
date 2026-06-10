/**
 * Browser-safe entry point. Everything exported here is environment-free — no
 * `node:` imports, no filesystem, no Prettier — so it can run in the browser
 * (e.g. a playground). Formatting, file I/O, and spec fetching live in the
 * Node-only main entry (`swagger-to-tanstack-query`).
 */

export { parseSpec } from "./parser.js";
export type { ParseOptions } from "./parser.js";

export { generateFiles } from "./build-files.js";
export type { GeneratedFile } from "./build-files.js";

export {
  generateApis,
  generateIndex,
  generateMutations,
  generateQueries,
  generateTypes,
} from "./generators.js";

export { envelopeLocalName, CONFIG_FILENAME } from "./config.js";
export type {
  ClientConfig,
  CodegenConfig,
  EnvelopeConfig,
  ErrorConfig,
  ResponseConfig,
  UserConfig,
} from "./config.js";

export type {
  ControllerIR,
  HttpMethod,
  OperationIR,
  ParamIR,
  ParsedSpec,
  TypeDeclIR,
} from "./types.js";
