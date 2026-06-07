import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

export const CONFIG_FILENAME = "swagger-to-tanstack-query.config.json";

export interface ClientConfig {
  /** Import path of the user's axios instance, e.g. `@/lib/axios`. */
  path: string;
  /** Named export to use. Omit (or use "default") for a default import. */
  name?: string;
}

export interface EnvelopeConfig {
  /** Import path of your generic envelope type, e.g. `CommonResponse<T>`. */
  path: string;
  /** Named export of the envelope type. Omit (or "default") for a default import. */
  name?: string;
}

export interface ResponseConfig {
  /**
   * Unwrap this field from the common response envelope so generated apis return
   * the inner payload (e.g. `data` → `res.data.data`). Only applied to operations
   * whose success schema actually has the field. Omit to keep the full envelope.
   */
  dataField?: string;
  /**
   * A generic envelope type to use instead of generating one `CommonResponseX`
   * interface per endpoint. Responses become `Envelope<Inner>` and the per-endpoint
   * envelope interfaces are no longer emitted. Requires `dataField`.
   */
  envelope?: EnvelopeConfig;
}

export interface ErrorConfig {
  /** Import path of your error-body type. */
  path: string;
  /** Named export of the error type. Omit (or "default") for a default import. */
  name?: string;
}

/** Local identifier used for the envelope import (default exports get a name). */
export function envelopeLocalName(env: { name: string }): string {
  return env.name === "default" ? "CommonResponse" : env.name;
}

export interface UserConfig {
  /** Swagger/OpenAPI document URL (or local file path). */
  url: string;
  /** Output directory for generated code, relative to cwd. */
  output: string;
  /** User-provided axios instance. */
  client: ClientConfig;
  /** Common success-envelope handling. */
  response?: ResponseConfig;
  /** Common error type, applied as `AxiosError<T>` to query/mutation hooks. */
  error?: ErrorConfig;
  /** Run Prettier over generated files. Default: true. */
  format?: boolean;
}

export interface ResolvedConfig {
  url: string;
  output: string;
  /** Absolute output path. */
  outputDir: string;
  client: Required<ClientConfig>;
  response: {
    dataField: string | null;
    envelope: Required<EnvelopeConfig> | null;
  };
  error: Required<ErrorConfig> | null;
  format: boolean;
}

function fail(message: string): never {
  throw new Error(`[config] ${message}`);
}

export async function loadConfig(cwd: string): Promise<ResolvedConfig> {
  const configPath = resolve(cwd, CONFIG_FILENAME);

  let raw: string;
  try {
    raw = await readFile(configPath, "utf-8");
  } catch {
    fail(
      `${CONFIG_FILENAME} not found in ${cwd}.\n` +
        `Create one, e.g.:\n` +
        JSON.stringify(
          {
            url: "https://api.example.com/v3/api-docs",
            output: "./src/generated",
            client: { path: "@/lib/axios", name: "axiosInstance" },
          },
          null,
          2,
        ),
    );
  }

  let parsed: UserConfig;
  try {
    parsed = JSON.parse(raw);
  } catch (e) {
    fail(`${CONFIG_FILENAME} is not valid JSON: ${(e as Error).message}`);
  }

  if (!parsed.url || typeof parsed.url !== "string") {
    fail(`"url" is required and must be a string.`);
  }
  if (!parsed.output || typeof parsed.output !== "string") {
    fail(`"output" is required and must be a string.`);
  }
  if (!parsed.client || typeof parsed.client.path !== "string") {
    fail(`"client.path" is required (path to your axios instance module).`);
  }
  if (parsed.error && typeof parsed.error.path !== "string") {
    fail(`"error.path" must be a string (path to your error type module).`);
  }
  const envelope = parsed.response?.envelope;
  if (envelope) {
    if (typeof envelope.path !== "string") {
      fail(`"response.envelope.path" must be a string (path to your generic envelope type).`);
    }
    if (!parsed.response?.dataField) {
      fail(`"response.dataField" is required when "response.envelope" is set.`);
    }
  }

  return {
    url: parsed.url,
    output: parsed.output,
    outputDir: resolve(cwd, parsed.output),
    client: {
      path: parsed.client.path,
      name: parsed.client.name ?? "default",
    },
    response: {
      dataField: parsed.response?.dataField ?? null,
      envelope: envelope
        ? { path: envelope.path, name: envelope.name ?? "default" }
        : null,
    },
    error: parsed.error
      ? { path: parsed.error.path, name: parsed.error.name ?? "default" }
      : null,
    format: parsed.format ?? true,
  };
}
