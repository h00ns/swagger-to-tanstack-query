import { indent } from "./utils.js";

/** Minimal structural view of an OpenAPI/JSON-Schema node. */
export interface SchemaObject {
  $ref?: string;
  type?: string | string[];
  format?: string;
  enum?: unknown[];
  const?: unknown;
  items?: SchemaObject;
  properties?: Record<string, SchemaObject>;
  required?: string[];
  allOf?: SchemaObject[];
  oneOf?: SchemaObject[];
  anyOf?: SchemaObject[];
  additionalProperties?: boolean | SchemaObject;
  nullable?: boolean;
  description?: string;
  title?: string;
}

/**
 * Turn a `#/components/schemas/Foo` (OpenAPI 3) or `#/definitions/Foo`
 * (Swagger 2) pointer into a sanitized TS type name. Used for BOTH the
 * declaration and every reference so they always match.
 */
export function refToTypeName(ref: string): string {
  const last = ref.split("/").pop() ?? ref;
  return sanitizeTypeName(decodeURIComponent(last));
}

/** Java/Spring emits names like `Page«User»` or `Map.Entry`; make them valid. */
export function sanitizeTypeName(name: string): string {
  const cleaned = name
    .replace(/[«<]/g, "Of")
    .replace(/[»>]/g, "")
    .replace(/[^a-zA-Z0-9_]+/g, "_")
    .replace(/_+/g, "_")
    .replace(/^_+|_+$/g, "");
  const safe = cleaned || "Anonymous";
  return /^[0-9]/.test(safe) ? `_${safe}` : safe;
}

interface Ctx {
  /** Record a named-type dependency discovered via `$ref`. */
  onRef: (typeName: string) => void;
}

/**
 * Render a schema node as a TypeScript type string.
 * `$ref`s become bare type names (and are reported via `ctx.onRef`).
 */
export function schemaToTs(schema: SchemaObject | undefined, ctx: Ctx): string {
  if (!schema) return "unknown";

  if (schema.$ref) {
    const name = refToTypeName(schema.$ref);
    ctx.onRef(name);
    return name;
  }

  // enum / const
  if (Array.isArray(schema.enum) && schema.enum.length > 0) {
    return withNullable(schema.enum.map(literal).join(" | "), schema);
  }
  if (schema.const !== undefined) {
    return withNullable(literal(schema.const), schema);
  }

  // composition
  if (schema.allOf?.length) {
    return withNullable(
      schema.allOf.map((s) => wrap(schemaToTs(s, ctx))).join(" & "),
      schema,
    );
  }
  if (schema.oneOf?.length) {
    return withNullable(schema.oneOf.map((s) => schemaToTs(s, ctx)).join(" | "), schema);
  }
  if (schema.anyOf?.length) {
    return withNullable(schema.anyOf.map((s) => schemaToTs(s, ctx)).join(" | "), schema);
  }

  const type = Array.isArray(schema.type) ? schema.type[0] : schema.type;

  switch (type) {
    case "string":
      return withNullable("string", schema);
    case "integer":
    case "number":
      return withNullable("number", schema);
    case "boolean":
      return withNullable("boolean", schema);
    case "null":
      return "null";
    case "array":
      return withNullable(`Array<${schemaToTs(schema.items, ctx)}>`, schema);
    case "object":
    default: {
      // object (explicit) or untyped node that still has properties
      if (schema.properties || schema.additionalProperties !== undefined) {
        return withNullable(objectType(schema, ctx), schema);
      }
      return type ? "unknown" : withNullable(objectType(schema, ctx), schema);
    }
  }
}

function objectType(schema: SchemaObject, ctx: Ctx): string {
  const required = new Set(schema.required ?? []);
  const props = schema.properties ?? {};
  const lines: string[] = [];

  for (const [key, value] of Object.entries(props)) {
    const optional = required.has(key) ? "" : "?";
    const propName = /^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(key) ? key : JSON.stringify(key);
    lines.push(`${propName}${optional}: ${schemaToTs(value, ctx)};`);
  }

  if (schema.additionalProperties === true) {
    lines.push("[key: string]: unknown;");
  } else if (schema.additionalProperties && typeof schema.additionalProperties === "object") {
    lines.push(`[key: string]: ${schemaToTs(schema.additionalProperties, ctx)};`);
  }

  if (lines.length === 0) {
    return schema.additionalProperties === false ? "Record<string, never>" : "Record<string, unknown>";
  }
  return `{\n${indent(lines.join("\n"))}\n}`;
}

function withNullable(type: string, schema: SchemaObject): string {
  return schema.nullable ? `${wrap(type)} | null` : type;
}

/** Parenthesize union/intersection types so suffixes bind correctly. */
function wrap(type: string): string {
  return /[|&]/.test(type) && !type.startsWith("{") ? `(${type})` : type;
}

function literal(value: unknown): string {
  if (typeof value === "string") return JSON.stringify(value);
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  if (value === null) return "null";
  return JSON.stringify(value);
}

/** Produce a top-level named declaration for a component schema. */
export function declareType(name: string, schema: SchemaObject, ctx: Ctx): string {
  // Object schemas become interfaces; everything else a type alias.
  const isObjectLike =
    !schema.$ref &&
    !schema.enum &&
    !schema.allOf &&
    !schema.oneOf &&
    !schema.anyOf &&
    (schema.type === "object" || (!schema.type && !!schema.properties));

  const doc = schema.description ? `/** ${schema.description.replace(/\*\//g, "*\\/")} */\n` : "";

  if (isObjectLike) {
    const body = objectType(schema, ctx);
    return `${doc}export interface ${name} ${body}`;
  }
  return `${doc}export type ${name} = ${schemaToTs(schema, ctx)};`;
}
