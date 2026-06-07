import type {
  ControllerIR,
  HttpMethod,
  OperationIR,
  ParamIR,
  ParsedSpec,
  TypeDeclIR,
} from "./types.js";
import {
  declareType,
  refToTypeName,
  type SchemaObject,
} from "./schema-to-ts.js";
import { schemaToTs } from "./schema-to-ts.js";
import { camelCase, kebabCase, pascalCase, safeIdentifier } from "./utils.js";

const METHODS: HttpMethod[] = ["get", "post", "put", "patch", "delete", "head", "options"];

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyObj = Record<string, any>;

/** Follow a local JSON pointer like `#/components/parameters/Foo`. */
function resolveRef(doc: AnyObj, ref: string): AnyObj | undefined {
  if (!ref.startsWith("#/")) return undefined;
  const parts = ref
    .slice(2)
    .split("/")
    .map((p) => p.replace(/~1/g, "/").replace(/~0/g, "~"));
  let cur: AnyObj | undefined = doc;
  for (const part of parts) {
    if (cur == null) return undefined;
    cur = cur[part];
  }
  return cur;
}

/** Resolve a node that might be a `$ref` wrapper (parameters, requestBody, responses). */
function deref(doc: AnyObj, node: AnyObj | undefined): AnyObj | undefined {
  if (node && typeof node === "object" && typeof node.$ref === "string") {
    return resolveRef(doc, node.$ref);
  }
  return node;
}

interface SchemaRegistryEntry {
  rawName: string;
  schema: SchemaObject;
}

export interface ParseOptions {
  /** Unwrap this envelope field as the payload (see ResponseConfig.dataField). */
  dataField?: string | null;
}

export function parseSpec(doc: AnyObj, options: ParseOptions = {}): ParsedSpec {
  const dataField = options.dataField ?? null;
  const isV2 = typeof doc.swagger === "string" && doc.swagger.startsWith("2");
  const schemasRoot: Record<string, SchemaObject> = isV2
    ? (doc.definitions ?? {})
    : (doc.components?.schemas ?? {});

  // sanitized type name -> schema (so generators can resolve `$ref` names back to declarations)
  const registry = new Map<string, SchemaRegistryEntry>();
  for (const [rawName, schema] of Object.entries(schemasRoot)) {
    const key = refToTypeName(`#/x/${rawName}`);
    if (!registry.has(key)) registry.set(key, { rawName, schema });
  }

  const controllers = new Map<string, ControllerIR>();
  const usedNamesPerController = new Map<string, Set<string>>();

  const paths: Record<string, AnyObj> = doc.paths ?? {};
  for (const [path, pathItemRaw] of Object.entries(paths)) {
    const pathItem = deref(doc, pathItemRaw) ?? {};
    const sharedParams: AnyObj[] = pathItem.parameters ?? [];

    for (const method of METHODS) {
      const op: AnyObj | undefined = pathItem[method];
      if (!op || typeof op !== "object") continue;

      const tag: string = op.tags?.[0] ?? "default";
      const controller = ensureController(controllers, tag);
      const refSink = ensureNameSet(usedNamesPerController, tag);
      const ctx = { onRef: (name: string) => refSink.add(name) };

      const operation = buildOperation({
        doc,
        op,
        path,
        method,
        sharedParams,
        controller,
        isV2,
        ctx,
        dataField,
      });
      controller.operations.push(operation);
    }
  }

  // For each controller, expand referenced type names transitively and emit declarations.
  for (const [tag, controller] of controllers) {
    const seed = usedNamesPerController.get(tag) ?? new Set<string>();
    controller.types = collectTypes(seed, registry);
  }

  return {
    controllers: [...controllers.values()].filter((c) => c.operations.length > 0),
  };
}

function ensureController(map: Map<string, ControllerIR>, tag: string): ControllerIR {
  let c = map.get(tag);
  if (!c) {
    c = {
      tag,
      dirName: kebabCase(tag),
      pascalName: pascalCase(tag),
      operations: [],
      types: [],
    };
    map.set(tag, c);
  }
  return c;
}

function ensureNameSet(map: Map<string, Set<string>>, tag: string): Set<string> {
  let s = map.get(tag);
  if (!s) {
    s = new Set();
    map.set(tag, s);
  }
  return s;
}

interface BuildArgs {
  doc: AnyObj;
  op: AnyObj;
  path: string;
  method: HttpMethod;
  sharedParams: AnyObj[];
  controller: ControllerIR;
  isV2: boolean;
  ctx: { onRef: (name: string) => void };
  dataField: string | null;
}

function buildOperation(args: BuildArgs): OperationIR {
  const { doc, op, path, method, sharedParams, controller, isV2, ctx, dataField } = args;

  const rawParams = [...sharedParams, ...(op.parameters ?? [])].map((p) => deref(doc, p) ?? p);

  const pathParams: ParamIR[] = [];
  const queryParams: ParamIR[] = [];
  let bodyType: string | null = null;

  for (const p of rawParams) {
    if (p.in === "path" || p.in === "query") {
      const schema: SchemaObject = p.schema ?? p; // v2 keeps type on the param itself
      const param: ParamIR = {
        name: p.name,
        safeName: safeIdentifier(p.name),
        in: p.in,
        required: p.in === "path" ? true : !!p.required,
        tsType: schemaToTs(schema, ctx),
      };
      (p.in === "path" ? pathParams : queryParams).push(param);
    } else if (isV2 && p.in === "body") {
      bodyType = schemaToTs(p.schema, ctx);
    }
  }

  // OpenAPI 3 request body
  if (!isV2 && op.requestBody) {
    const rb = deref(doc, op.requestBody);
    const schema = pickJsonSchema(rb?.content);
    if (schema) bodyType = schemaToTs(schema, ctx);
  }

  const { type: responseType, unwrap } = resolveResponseType(doc, op, isV2, ctx, dataField);

  const name = uniqueOperationName(op, method, path, controller);
  const kind = method === "get" || method === "head" ? "query" : "mutation";

  return {
    name,
    method,
    path,
    summary: op.summary,
    pathParams,
    queryParams,
    requestBodyType: bodyType,
    responseType,
    responseUnwrap: unwrap,
    kind,
  };
}

function pickJsonSchema(content: AnyObj | undefined): SchemaObject | undefined {
  if (!content) return undefined;
  const json =
    content["application/json"] ??
    content["application/*+json"] ??
    content[Object.keys(content)[0]];
  return json?.schema;
}

function resolveResponseType(
  doc: AnyObj,
  op: AnyObj,
  isV2: boolean,
  ctx: { onRef: (name: string) => void },
  dataField: string | null,
): { type: string; unwrap: boolean } {
  const responses: AnyObj = op.responses ?? {};
  const successKey =
    Object.keys(responses).find((k) => /^2\d\d$/.test(k)) ??
    (responses["2XX"] ? "2XX" : undefined) ??
    (responses.default ? "default" : undefined);
  if (!successKey) return { type: "void", unwrap: false };

  const res = deref(doc, responses[successKey]);
  if (!res) return { type: "void", unwrap: false };

  const schema = isV2 ? res.schema : pickJsonSchema(res.content);
  if (!schema) return { type: "void", unwrap: false };

  const type = schemaToTs(schema, ctx);
  const unwrap = dataField ? schemaHasProperty(doc, schema, dataField) : false;
  return { type, unwrap };
}

/** Whether a (possibly `$ref`'d) schema declares the given property. */
function schemaHasProperty(doc: AnyObj, schema: SchemaObject, field: string): boolean {
  const resolved = schema.$ref ? (resolveRef(doc, schema.$ref) as SchemaObject | undefined) : schema;
  return !!resolved?.properties && field in resolved.properties;
}

function uniqueOperationName(
  op: AnyObj,
  method: HttpMethod,
  path: string,
  controller: ControllerIR,
): string {
  let base: string;
  if (typeof op.operationId === "string" && op.operationId.trim()) {
    base = camelCase(op.operationId);
  } else {
    const segs = path.split("/").filter(Boolean).map((s) => s.replace(/[{}]/g, ""));
    base = camelCase([method, ...segs].join(" "));
  }
  const existing = new Set(controller.operations.map((o) => o.name));
  if (!existing.has(base)) return base;
  let i = 2;
  while (existing.has(`${base}${i}`)) i++;
  return `${base}${i}`;
}

/** Walk the reference graph, emitting a declaration for every reachable named type. */
function collectTypes(
  seed: Set<string>,
  registry: Map<string, SchemaRegistryEntry>,
): TypeDeclIR[] {
  const visited = new Set<string>();
  const queue = [...seed];
  const decls: TypeDeclIR[] = [];

  while (queue.length) {
    const name = queue.shift()!;
    if (visited.has(name)) continue;
    visited.add(name);

    const entry = registry.get(name);
    if (!entry) continue; // referenced but not declared (e.g. inline-only) -> skip

    const childRefs = new Set<string>();
    const code = declareType(name, entry.schema, {
      onRef: (n) => childRefs.add(n),
    });
    decls.push({ name, code });

    for (const child of childRefs) {
      if (!visited.has(child)) queue.push(child);
    }
  }

  return decls.sort((a, b) => a.name.localeCompare(b.name));
}
