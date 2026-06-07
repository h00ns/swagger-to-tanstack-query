import { describe, expect, it } from "vitest";
import type { ResolvedConfig } from "../src/config.js";
import { parseSpec } from "../src/parser.js";
import {
  generateApis,
  generateMutations,
  generateQueries,
} from "../src/generators.js";
import type { ControllerIR } from "../src/types.js";
import { sampleSpec, swagger2Spec } from "./fixtures.js";

const baseConfig: ResolvedConfig = {
  url: "x",
  output: "out",
  outputDir: "/out",
  client: { path: "@/lib/axios", name: "axiosInstance" },
  response: { dataField: "data" },
  error: null,
  format: false,
};

const withError: ResolvedConfig = {
  ...baseConfig,
  error: { path: "@/lib/axios", name: "ApiError" },
};

function parse(config: ResolvedConfig = baseConfig) {
  return parseSpec(sampleSpec, { dataField: config.response.dataField });
}

function controller(dirName: string): ControllerIR {
  const c = parse().controllers.find((x) => x.dirName === dirName);
  if (!c) throw new Error(`controller ${dirName} not found`);
  return c;
}

describe("controller splitting", () => {
  it("splits by tag and emits multi-tag operations into every tag", () => {
    const dirs = parse().controllers.map((c) => c.dirName).sort();
    expect(dirs).toEqual(["search", "user"]);

    // listUsers is tagged [User, Search] -> present in both
    expect(controller("user").operations.map((o) => o.name)).toContain("listUsers");
    expect(controller("search").operations.map((o) => o.name)).toContain("listUsers");
  });

  it("classifies GET as query and others as mutation", () => {
    const ops = controller("user").operations;
    expect(ops.find((o) => o.name === "getUser")?.kind).toBe("query");
    expect(ops.find((o) => o.name === "createUser")?.kind).toBe("mutation");
  });

  it("escapes reserved-word operation ids", () => {
    expect(controller("user").operations.map((o) => o.name)).toContain("delete_");
  });
});

describe("apis.ts", () => {
  const apis = generateApis(controller("user"), baseConfig);

  it("imports the configured axios instance", () => {
    expect(apis).toContain('import { axiosInstance as client } from "@/lib/axios";');
  });

  it("interpolates path params and unwraps the envelope", () => {
    expect(apis).toContain("client.get<CommonResponseUser>(`/users/${id}`");
    expect(apis).toContain(".then((res) => res.data.data)");
  });

  it("does not unwrap void responses", () => {
    expect(apis).toMatch(/export const delete_ = \(id: number\) =>\s*\n\s*client\.delete<void>/);
    expect(apis).toContain("client.delete<void>(`/users/${id}`).then((res) => res.data)");
  });

  it("passes header params via config with their real wire names", () => {
    expect(apis).toContain('headers: { "X-Trace-Id": string }');
    expect(apis).toContain("{ headers }");
  });

  it("preserves real query param names (no identifier mangling on the wire)", () => {
    expect(apis).toContain('params?: { "page-size"?: number }');
    expect(apis).toContain("{ params }");
  });

  it("builds FormData for multipart uploads with Blob file fields", () => {
    expect(apis).toContain("const formData = new FormData();");
    expect(apis).toContain("formData.append(key, value instanceof Blob ? value : String(value));");
    expect(apis).toContain("file?: Blob");
  });
});

describe("queries.ts", () => {
  it("uses the queryOptions pattern with structured keys", () => {
    const q = generateQueries(controller("user"), baseConfig);
    expect(q).toContain('import { queryOptions } from "@tanstack/react-query";');
    expect(q).toContain("export const userQueries = {");
    expect(q).toContain('queryKey: ["user", "getUser", id, headers]');
  });

  it("applies the error type as explicit generics when configured", () => {
    const q = generateQueries(controller("user"), withError);
    expect(q).toContain('import type { AxiosError } from "axios";');
    expect(q).toContain("queryOptions<Awaited<ReturnType<typeof apis.getUser>>, AxiosError<ApiError>>");
  });

  it("marks deprecated operations", () => {
    const q = generateQueries(controller("user"), baseConfig);
    expect(q).toContain("@deprecated");
  });
});

describe("mutations.ts", () => {
  it("generates useXxx hooks that accept options", () => {
    const m = generateMutations(controller("user"), baseConfig);
    expect(m).toContain("export const useCreateUser = (options?:");
    expect(m).toContain("mutationFn: (body: User) => apis.createUser(body)");
    expect(m).toContain("...options,");
  });

  it("combines multiple inputs into a single variables object", () => {
    const m = generateMutations(controller("user"), baseConfig);
    expect(m).toContain("apis.uploadAvatar(id, body)");
  });

  it("uses the configured error type, else DefaultError", () => {
    expect(generateMutations(controller("user"), baseConfig)).toContain("DefaultError");
    expect(generateMutations(controller("user"), withError)).toContain("AxiosError<ApiError>");
  });
});

describe("Swagger 2.0 support", () => {
  it("parses definitions and in:body params", () => {
    const spec = parseSpec(swagger2Spec, {});
    const pet = spec.controllers.find((c) => c.dirName === "pet")!;
    expect(pet.operations.map((o) => o.name).sort()).toEqual(["addPet", "listPets"]);

    const apis = generateApis(pet, baseConfig);
    expect(apis).toContain("client.post<Pet>(`/pets`, body)");
    expect(apis).toContain("export const listPets = () =>");
  });
});
