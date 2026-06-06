/**
 * Internal representation (IR) the parser produces and the generators consume.
 * This decouples the messy OpenAPI/Swagger shape from our code-generation logic.
 */

export type HttpMethod = "get" | "post" | "put" | "patch" | "delete" | "head" | "options";

/** A single request/response parameter (path, query, header). */
export interface ParamIR {
  name: string;
  /** Sanitized, valid JS identifier version of `name`. */
  safeName: string;
  in: "path" | "query" | "header";
  required: boolean;
  /** TypeScript type string, e.g. `number`, `string`, `'a' | 'b'`. */
  tsType: string;
}

/** One API operation (one endpoint + method). */
export interface OperationIR {
  /** Function name used in apis.ts / queries.ts / mutations.ts. */
  name: string;
  method: HttpMethod;
  /** Raw path with `{braces}`, e.g. `/users/{id}`. */
  path: string;
  summary?: string;
  pathParams: ParamIR[];
  queryParams: ParamIR[];
  /** TS type of the request body, or null when there is none. */
  requestBodyType: string | null;
  /** TS type of the success response, defaults to `void`/`unknown`. */
  responseType: string;
  /** GET/HEAD -> query, everything else -> mutation. */
  kind: "query" | "mutation";
}

/** A controller groups operations (derived from OpenAPI tags). */
export interface ControllerIR {
  /** Original tag name, e.g. `user-controller`. */
  tag: string;
  /** kebab-case folder name. */
  dirName: string;
  /** PascalCase base used for exported symbol names. */
  pascalName: string;
  operations: OperationIR[];
  /** Named TS type declarations this controller needs (for types.ts). */
  types: TypeDeclIR[];
}

/** A named TypeScript type/interface declaration. */
export interface TypeDeclIR {
  name: string;
  /** Full declaration body, e.g. `export interface User { ... }`. */
  code: string;
}

export interface ParsedSpec {
  controllers: ControllerIR[];
}
