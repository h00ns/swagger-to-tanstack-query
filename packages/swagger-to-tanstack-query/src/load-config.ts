import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { CONFIG_FILENAME, type ResolvedConfig, type UserConfig } from "./config.js";

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
