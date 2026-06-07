/** A compact OpenAPI 3 doc exercising the generator's notable paths. */
export const sampleSpec = {
  openapi: "3.0.0",
  info: { title: "sample", version: "1.0.0" },
  paths: {
    "/users/{id}": {
      get: {
        tags: ["User"],
        operationId: "getUser",
        summary: "Get a user",
        parameters: [
          { name: "id", in: "path", required: true, schema: { type: "integer" } },
          { name: "X-Trace-Id", in: "header", required: true, schema: { type: "string" } },
        ],
        responses: {
          "200": {
            content: {
              "application/json": { schema: { $ref: "#/components/schemas/CommonResponseUser" } },
            },
          },
        },
      },
      delete: {
        tags: ["User"],
        operationId: "delete", // reserved word -> must be escaped
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "integer" } }],
        responses: { "204": { description: "No Content" } },
      },
    },
    "/users": {
      get: {
        tags: ["User", "Search"], // multi-tag -> emitted into both controllers
        operationId: "listUsers",
        deprecated: true,
        parameters: [
          { name: "page-size", in: "query", required: false, schema: { type: "integer" } },
        ],
        responses: {
          "200": {
            content: {
              "application/json": { schema: { $ref: "#/components/schemas/CommonResponseUsers" } },
            },
          },
        },
      },
      post: {
        tags: ["User"],
        operationId: "createUser",
        requestBody: {
          content: { "application/json": { schema: { $ref: "#/components/schemas/User" } } },
        },
        responses: {
          "200": {
            content: {
              "application/json": { schema: { $ref: "#/components/schemas/CommonResponseUser" } },
            },
          },
        },
      },
    },
    "/users/{id}/avatar": {
      post: {
        tags: ["User"],
        operationId: "uploadAvatar",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "integer" } }],
        requestBody: {
          content: {
            "multipart/form-data": {
              schema: {
                type: "object",
                properties: {
                  file: { type: "string", format: "binary" },
                  caption: { type: "string" },
                },
              },
            },
          },
        },
        responses: {
          "200": {
            content: {
              "application/json": { schema: { $ref: "#/components/schemas/CommonResponseUser" } },
            },
          },
        },
      },
    },
  },
  components: {
    schemas: {
      User: {
        type: "object",
        required: ["id", "name"],
        properties: {
          id: { type: "integer" },
          name: { type: "string" },
          role: { type: "string", enum: ["admin", "user"] },
          bio: { type: "string", nullable: true },
        },
      },
      CommonResponseUser: {
        type: "object",
        properties: {
          result: { type: "boolean" },
          data: { $ref: "#/components/schemas/User" },
          message: { type: "string" },
        },
      },
      CommonResponseUsers: {
        type: "object",
        properties: {
          result: { type: "boolean" },
          data: { type: "array", items: { $ref: "#/components/schemas/User" } },
        },
      },
    },
  },
};

/** Minimal Swagger 2.0 doc to verify dual-spec support. */
export const swagger2Spec = {
  swagger: "2.0",
  info: { title: "v2", version: "1.0.0" },
  paths: {
    "/pets": {
      get: {
        tags: ["Pet"],
        operationId: "listPets",
        responses: { "200": { schema: { type: "array", items: { $ref: "#/definitions/Pet" } } } },
      },
      post: {
        tags: ["Pet"],
        operationId: "addPet",
        parameters: [{ name: "body", in: "body", schema: { $ref: "#/definitions/Pet" } }],
        responses: { "200": { schema: { $ref: "#/definitions/Pet" } } },
      },
    },
  },
  definitions: {
    Pet: {
      type: "object",
      required: ["id"],
      properties: { id: { type: "integer" }, name: { type: "string" } },
    },
  },
};
