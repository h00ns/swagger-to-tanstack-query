/**
 * Bundled OpenAPI/Swagger specs for the playground. Each is intentionally small
 * but exercises the generator's notable paths (envelopes, path/query params,
 * request bodies, enums, `$ref`s, multiple controllers).
 */
export interface Example {
  id: string;
  label: string;
  description: string;
  spec: unknown;
}

const contactSpec = {
  openapi: "3.0.0",
  info: { title: "Contact API", version: "1.0.0" },
  paths: {
    "/api/v1/contacts/{contactId}": {
      get: {
        tags: ["Contact"],
        operationId: "getContact",
        summary: "Get contact details",
        parameters: [
          { name: "contactId", in: "path", required: true, schema: { type: "integer" } },
        ],
        responses: {
          "200": {
            content: {
              "application/json": { schema: { $ref: "#/components/schemas/CommonResponseDetail" } },
            },
          },
        },
      },
      put: {
        tags: ["Contact"],
        operationId: "updateContact",
        summary: "Update a contact",
        parameters: [
          { name: "contactId", in: "path", required: true, schema: { type: "integer" } },
        ],
        requestBody: {
          content: { "application/json": { schema: { $ref: "#/components/schemas/Update" } } },
        },
        responses: {
          "200": {
            content: {
              "application/json": { schema: { $ref: "#/components/schemas/CommonResponseDetail" } },
            },
          },
        },
      },
      delete: {
        tags: ["Contact"],
        operationId: "deleteContact",
        summary: "Delete a single contact",
        parameters: [
          { name: "contactId", in: "path", required: true, schema: { type: "integer" } },
        ],
        responses: { "204": { description: "No Content" } },
      },
    },
    "/api/v1/contacts": {
      get: {
        tags: ["Contact"],
        operationId: "listContacts",
        summary: "List contacts",
        parameters: [
          { name: "page", in: "query", required: false, schema: { type: "integer" } },
          { name: "size", in: "query", required: false, schema: { type: "integer" } },
        ],
        responses: {
          "200": {
            content: {
              "application/json": { schema: { $ref: "#/components/schemas/CommonResponseDetailList" } },
            },
          },
        },
      },
      post: {
        tags: ["Contact"],
        operationId: "createContact",
        summary: "Create a contact",
        requestBody: {
          content: { "application/json": { schema: { $ref: "#/components/schemas/Create" } } },
        },
        responses: {
          "200": {
            content: {
              "application/json": { schema: { $ref: "#/components/schemas/CommonResponseDetail" } },
            },
          },
        },
      },
    },
    "/api/v1/users/{id}": {
      get: {
        tags: ["User"],
        operationId: "getUser",
        summary: "Get a user",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "integer" } }],
        responses: {
          "200": {
            content: { "application/json": { schema: { $ref: "#/components/schemas/CommonResponseUser" } } },
          },
        },
      },
    },
  },
  components: {
    schemas: {
      CommonResponseDetail: {
        type: "object",
        description: "Common API response envelope",
        properties: {
          result: { type: "boolean" },
          data: { $ref: "#/components/schemas/Detail" },
          message: { type: "string" },
          errorCode: { type: "string", nullable: true },
        },
      },
      CommonResponseDetailList: {
        type: "object",
        properties: {
          result: { type: "boolean" },
          data: { type: "array", items: { $ref: "#/components/schemas/Detail" } },
          message: { type: "string" },
          errorCode: { type: "string", nullable: true },
        },
      },
      CommonResponseUser: {
        type: "object",
        properties: {
          result: { type: "boolean" },
          data: { $ref: "#/components/schemas/User" },
          message: { type: "string" },
          errorCode: { type: "string", nullable: true },
        },
      },
      Detail: {
        type: "object",
        required: ["name"],
        properties: {
          id: { type: "integer" },
          name: { type: "string" },
          phoneNumber: { type: "string" },
          status: { type: "string", enum: ["ACTIVE", "ARCHIVED", "DELETED"] },
          tags: { type: "array", items: { $ref: "#/components/schemas/Tag" } },
        },
      },
      Create: {
        type: "object",
        required: ["name", "phoneNumber"],
        properties: {
          name: { type: "string" },
          phoneNumber: { type: "string" },
        },
      },
      Update: {
        type: "object",
        properties: {
          name: { type: "string" },
          phoneNumber: { type: "string" },
        },
      },
      Tag: {
        type: "object",
        properties: { id: { type: "integer" }, label: { type: "string" } },
      },
      User: {
        type: "object",
        properties: {
          id: { type: "integer" },
          email: { type: "string" },
          displayName: { type: "string" },
        },
      },
    },
  },
};

const petstoreSpec = {
  openapi: "3.0.0",
  info: { title: "Swagger Petstore", version: "1.0.0" },
  paths: {
    "/pets": {
      get: {
        tags: ["Pets"],
        operationId: "listPets",
        summary: "List all pets",
        parameters: [{ name: "limit", in: "query", required: false, schema: { type: "integer" } }],
        responses: {
          "200": {
            content: { "application/json": { schema: { type: "array", items: { $ref: "#/components/schemas/Pet" } } } },
          },
        },
      },
      post: {
        tags: ["Pets"],
        operationId: "createPet",
        summary: "Create a pet",
        requestBody: {
          content: { "application/json": { schema: { $ref: "#/components/schemas/NewPet" } } },
        },
        responses: {
          "201": { content: { "application/json": { schema: { $ref: "#/components/schemas/Pet" } } } },
        },
      },
    },
    "/pets/{petId}": {
      get: {
        tags: ["Pets"],
        operationId: "getPetById",
        summary: "Info for a specific pet",
        parameters: [{ name: "petId", in: "path", required: true, schema: { type: "string" } }],
        responses: {
          "200": { content: { "application/json": { schema: { $ref: "#/components/schemas/Pet" } } } },
        },
      },
    },
  },
  components: {
    schemas: {
      Pet: {
        type: "object",
        required: ["id", "name"],
        properties: {
          id: { type: "integer", format: "int64" },
          name: { type: "string" },
          tag: { type: "string" },
          status: { type: "string", enum: ["available", "pending", "sold"] },
        },
      },
      NewPet: {
        type: "object",
        required: ["name"],
        properties: {
          name: { type: "string" },
          tag: { type: "string" },
        },
      },
    },
  },
};

export const EXAMPLES: Example[] = [
  {
    id: "contact",
    label: "Contact API",
    description: "Spring-style API with a CommonResponse envelope, two controllers, enums and refs.",
    spec: contactSpec,
  },
  {
    id: "petstore",
    label: "Petstore",
    description: "The classic minimal OpenAPI example — no envelope.",
    spec: petstoreSpec,
  },
];

export function exampleAsText(example: Example): string {
  return JSON.stringify(example.spec, null, 2);
}
