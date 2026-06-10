import {
  envelopeLocalName,
  generateFiles,
  parseSpec,
  type CodegenConfig,
  type GeneratedFile,
} from "swagger-to-tanstack-query/core";
import { parse as parseYaml } from "yaml";
import * as prettier from "prettier/standalone";
import * as estree from "prettier/plugins/estree";
import * as typescript from "prettier/plugins/typescript";

/** Flat, form-friendly shape of the generator config (all strings, like the UI). */
export interface PlaygroundConfig {
  clientPath: string;
  clientName: string;
  dataField: string;
  envelopePath: string;
  envelopeName: string;
  errorPath: string;
  errorName: string;
  format: boolean;
}

export const DEFAULT_CONFIG: PlaygroundConfig = {
  clientPath: "@/lib/axios",
  clientName: "axiosInstance",
  dataField: "data",
  envelopePath: "@/lib/axios",
  envelopeName: "CommonResponse",
  errorPath: "@/lib/axios",
  errorName: "ApiError",
  format: true,
};

export interface GenerateResult {
  files: GeneratedFile[];
  controllers: number;
}

/** Parse spec source text as JSON, falling back to YAML. Throws on both failing. */
export function parseSpecText(text: string): unknown {
  const trimmed = text.trim();
  if (!trimmed) throw new Error("The spec is empty. Paste an OpenAPI/Swagger document.");
  try {
    return JSON.parse(trimmed);
  } catch {
    try {
      return parseYaml(trimmed);
    } catch (e) {
      throw new Error(`Could not parse the spec as JSON or YAML: ${(e as Error).message}`);
    }
  }
}

/** Build the environment-free CodegenConfig the generators consume. */
function toCodegenConfig(config: PlaygroundConfig): CodegenConfig {
  const dataField = config.dataField.trim() || null;
  const envelope =
    config.envelopePath.trim() && dataField
      ? { path: config.envelopePath.trim(), name: config.envelopeName.trim() || "default" }
      : null;
  const error = config.errorPath.trim()
    ? { path: config.errorPath.trim(), name: config.errorName.trim() || "default" }
    : null;

  return {
    client: { path: config.clientPath.trim() || "@/lib/axios", name: config.clientName.trim() || "default" },
    response: { dataField, envelope },
    error,
  };
}

async function formatTs(code: string): Promise<string> {
  try {
    return await prettier.format(code, {
      parser: "typescript",
      plugins: [estree, typescript],
      semi: true,
      singleQuote: false,
      trailingComma: "all",
    });
  } catch {
    // Prettier is best-effort; fall back to the raw (already valid) output.
    return code;
  }
}

/**
 * Full browser pipeline: parse the spec, run the generators, optionally format.
 * Mirrors the Node `generate()` entry point but returns files in memory.
 */
export async function generate(
  specText: string,
  config: PlaygroundConfig,
): Promise<GenerateResult> {
  const doc = parseSpecText(specText);
  const codegen = toCodegenConfig(config);
  const envelopeName = codegen.response.envelope
    ? envelopeLocalName(codegen.response.envelope)
    : null;

  const spec = parseSpec(doc as Record<string, unknown>, {
    dataField: codegen.response.dataField,
    envelopeName,
  });

  if (spec.controllers.length === 0) {
    throw new Error(
      "No operations found. Make sure the document has a `paths` object with operations.",
    );
  }

  const files = generateFiles(spec, codegen);
  const finalFiles = config.format
    ? await Promise.all(files.map(async (f) => ({ ...f, content: await formatTs(f.content) })))
    : files;

  return { files: finalFiles, controllers: spec.controllers.length };
}
