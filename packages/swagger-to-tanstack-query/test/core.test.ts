import { describe, expect, it } from "vitest";
import type { CodegenConfig } from "../src/config.js";
import { generateFiles } from "../src/build-files.js";
import {
  generateApis,
  generateIndex,
  generateQueries,
} from "../src/generators.js";
import { parseSpec } from "../src/parser.js";
import { sampleSpec } from "./fixtures.js";

const config: CodegenConfig = {
  client: { path: "@/lib/axios", name: "axiosInstance" },
  response: { dataField: "data", envelope: null },
  error: null,
};

const FILE_NAMES = ["types.ts", "apis.ts", "queries.ts", "mutations.ts", "index.ts"];

describe("generateFiles (browser-safe core)", () => {
  const spec = parseSpec(sampleSpec, { dataField: "data" });
  const files = generateFiles(spec, config);

  it("emits five files per controller with controller-relative paths", () => {
    expect(spec.controllers.length).toBeGreaterThan(0);
    expect(files).toHaveLength(spec.controllers.length * FILE_NAMES.length);

    for (const controller of spec.controllers) {
      for (const name of FILE_NAMES) {
        const path = `${controller.dirName}/${name}`;
        expect(files.find((f) => f.path === path)).toBeDefined();
      }
    }
  });

  it("returns the same content the individual generators produce", () => {
    const controller = spec.controllers[0];
    const apis = files.find((f) => f.path === `${controller.dirName}/apis.ts`);
    const queries = files.find((f) => f.path === `${controller.dirName}/queries.ts`);
    const index = files.find((f) => f.path === `${controller.dirName}/index.ts`);

    expect(apis?.content).toBe(generateApis(controller, config));
    expect(queries?.content).toBe(generateQueries(controller, config));
    expect(index?.content).toBe(generateIndex());
  });

  it("produces no absolute filesystem paths (browser-safe)", () => {
    for (const file of files) {
      expect(file.path.startsWith("/")).toBe(false);
      expect(file.path).toContain("/");
    }
  });
});
