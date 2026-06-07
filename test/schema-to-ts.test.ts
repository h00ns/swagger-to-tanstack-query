import { describe, expect, it } from "vitest";
import {
  declareType,
  refToTypeName,
  sanitizeTypeName,
  schemaToTs,
  type SchemaObject,
} from "../src/schema-to-ts.js";

const noop = { onRef: () => {} };

function ts(schema: SchemaObject): string {
  return schemaToTs(schema, noop);
}

describe("schemaToTs primitives", () => {
  it("maps scalar types", () => {
    expect(ts({ type: "string" })).toBe("string");
    expect(ts({ type: "integer" })).toBe("number");
    expect(ts({ type: "number" })).toBe("number");
    expect(ts({ type: "boolean" })).toBe("boolean");
  });

  it("maps binary string to Blob", () => {
    expect(ts({ type: "string", format: "binary" })).toBe("Blob");
  });

  it("arrays", () => {
    expect(ts({ type: "array", items: { type: "string" } })).toBe("Array<string>");
  });

  it("enums as string-literal unions", () => {
    expect(ts({ type: "string", enum: ["a", "b"] })).toBe('"a" | "b"');
  });

  it("nullable wraps with | null", () => {
    expect(ts({ type: "string", nullable: true })).toBe("string | null");
    expect(ts({ type: "string", enum: ["a", "b"], nullable: true })).toBe('("a" | "b") | null');
  });
});

describe("schemaToTs composition & refs", () => {
  it("$ref becomes a bare type name and reports the dependency", () => {
    const refs: string[] = [];
    const out = schemaToTs({ $ref: "#/components/schemas/User" }, { onRef: (n) => refs.push(n) });
    expect(out).toBe("User");
    expect(refs).toEqual(["User"]);
  });

  it("allOf -> intersection", () => {
    expect(ts({ allOf: [{ $ref: "#/c/A" }, { $ref: "#/c/B" }] })).toBe("A & B");
  });

  it("oneOf -> union", () => {
    expect(ts({ oneOf: [{ type: "string" }, { type: "number" }] })).toBe("string | number");
  });

  it("object with required + optional props", () => {
    const out = ts({
      type: "object",
      required: ["id"],
      properties: { id: { type: "integer" }, name: { type: "string" } },
    });
    expect(out).toContain("id: number;");
    expect(out).toContain("name?: string;");
  });

  it("additionalProperties -> index signature", () => {
    expect(ts({ type: "object", additionalProperties: { type: "number" } })).toBe(
      "{\n  [key: string]: number;\n}",
    );
  });
});

describe("type names", () => {
  it("refToTypeName takes the last segment", () => {
    expect(refToTypeName("#/components/schemas/User")).toBe("User");
    expect(refToTypeName("#/definitions/Pet")).toBe("Pet");
  });

  it("sanitizes Java generic names", () => {
    expect(sanitizeTypeName("Page«User»")).toBe("PageOfUser");
    expect(sanitizeTypeName("Map.Entry")).toBe("Map_Entry");
  });
});

describe("declareType", () => {
  it("object schema -> interface", () => {
    const out = declareType(
      "User",
      { type: "object", required: ["id"], properties: { id: { type: "integer" } } },
      noop,
    );
    expect(out).toContain("export interface User {");
    expect(out).toContain("id: number;");
  });

  it("enum schema -> type alias", () => {
    const out = declareType("Role", { type: "string", enum: ["admin", "user"] }, noop);
    expect(out).toBe('export type Role = "admin" | "user";');
  });
});
