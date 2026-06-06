import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

export const CONFIG_FILENAME = "swagger-tanstack-builder.config.json";

export interface ClientConfig {
  /** Import path of the user's axios instance, e.g. `@/lib/axios`. */
  path: string;
  /** Named export to use. Omit (or use "default") for a default import. */
  name?: string;
}

export interface UserConfig {
  /** Swagger/OpenAPI document URL (or local file path). */
  url: string;
  /** Output directory for generated code, relative to cwd. */
  output: string;
  /** User-provided axios instance. */
  client: ClientConfig;
  /** Run Prettier over generated files. Default: true. */
  format?: boolean;
}

export interface ResolvedConfig extends Required<Omit<UserConfig, "client">> {
  client: Required<ClientConfig>;
  /** Absolute output path. */
  outputDir: string;
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

  return {
    url: parsed.url,
    output: parsed.output,
    outputDir: resolve(cwd, parsed.output),
    client: {
      path: parsed.client.path,
      name: parsed.client.name ?? "default",
    },
    format: parsed.format ?? true,
  };
}
