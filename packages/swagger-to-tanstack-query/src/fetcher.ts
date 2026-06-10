import SwaggerParser from "@apidevtools/swagger-parser";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyObj = Record<string, any>;

/**
 * Fetch and bundle a Swagger/OpenAPI document from a URL or local path.
 * `bundle` resolves external `$ref`s but keeps internal pointers
 * (e.g. `#/components/schemas/User`) intact so we can emit named types.
 */
export async function fetchSpec(urlOrPath: string): Promise<AnyObj> {
  try {
    const doc = (await SwaggerParser.bundle(urlOrPath)) as AnyObj;
    return doc;
  } catch (e) {
    throw new Error(`[fetch] Failed to load spec from "${urlOrPath}": ${(e as Error).message}`);
  }
}
