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

/**
 * The configuration the code generators actually read. It is environment-free
 * (no filesystem paths), so it can be built and run in a browser as well as Node.
 */
export interface CodegenConfig {
  client: Required<ClientConfig>;
  response: {
    dataField: string | null;
    envelope: Required<EnvelopeConfig> | null;
  };
  error: Required<ErrorConfig> | null;
}

/** A fully-resolved config for the Node pipeline: codegen options + filesystem I/O. */
export interface ResolvedConfig extends CodegenConfig {
  url: string;
  output: string;
  /** Absolute output path. */
  outputDir: string;
  format: boolean;
}
