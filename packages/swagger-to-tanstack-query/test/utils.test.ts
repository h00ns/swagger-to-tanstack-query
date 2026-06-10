import { describe, expect, it } from "vitest";
import {
  camelCase,
  escapeReserved,
  kebabCase,
  pascalCase,
  propertyKey,
  safeIdentifier,
} from "../src/utils.js";

describe("case helpers", () => {
  it("camelCase", () => {
    expect(camelCase("user-controller")).toBe("userController");
    expect(camelCase("X-Trace-Id")).toBe("xTraceId");
    expect(camelCase("getUserUsingGET")).toBe("getUserUsingGet");
    expect(camelCase("page_size")).toBe("pageSize");
  });

  it("kebabCase", () => {
    expect(kebabCase("UserController")).toBe("user-controller");
    expect(kebabCase("ContactTag")).toBe("contact-tag");
    expect(kebabCase("Internal Webhooks")).toBe("internal-webhooks");
  });

  it("pascalCase", () => {
    expect(pascalCase("user-controller")).toBe("UserController");
    expect(pascalCase("contact tag")).toBe("ContactTag");
  });
});

describe("escapeReserved", () => {
  it("appends _ to reserved words only", () => {
    expect(escapeReserved("delete")).toBe("delete_");
    expect(escapeReserved("default")).toBe("default_");
    expect(escapeReserved("function")).toBe("function_");
    expect(escapeReserved("user")).toBe("user");
  });
});

describe("safeIdentifier", () => {
  it("produces valid identifiers", () => {
    expect(safeIdentifier("page-size")).toBe("pageSize");
    expect(safeIdentifier("2fa")).toBe("_2fa");
    expect(safeIdentifier("delete")).toBe("delete_"); // reserved
  });
});

describe("propertyKey", () => {
  it("keeps valid keys bare and quotes the rest", () => {
    expect(propertyKey("pageSize")).toBe("pageSize");
    expect(propertyKey("page-size")).toBe('"page-size"');
    expect(propertyKey("X-Trace-Id")).toBe('"X-Trace-Id"');
  });
});
