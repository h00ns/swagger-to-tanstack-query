import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

export const CONFIG_FILENAME = "swagger-tanstack-builder.config.json";

export interface ClientConfig {
  /** Import path of the user's axios instance, e.g. `@/lib/axios`. */
  path: string;
  /** Named export to use. Omit (or use "default") for a default import. */
  name?: string;
}

export interface ResponseConfig {
  /**
   * Unwrap this field from the common response envelope so generated apis return
   * the inner payload (e.g. `data` → `res.data.data`). Only applied to operations
   * whose success schema actually has the field. Omit to keep the full envelope.
   */
  dataField?: string;
}

export interface ErrorConfig {
  /** Import path of your error-body type. */
  path: string;
  /** Named export of the error type. Omit (or "default") for a default import. */
  name?: string;
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
  response: { dataField: string | null };
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
    },
    error: parsed.error
      ? { path: parsed.error.path, name: parsed.error.name ?? "default" }
      : null,
    format: parsed.format ?? true,
  };
}
