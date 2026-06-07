# swagger-tanstack-builder

> A code generator that turns a **Swagger / OpenAPI** spec into typed **TanStack
> Query** code — split by controller — using **your own axios instance**.

Add a config file, point it at your Swagger URL, run one script, and get
fully-typed **API functions**, **`queryOptions`**, and **`useMutation` hooks** in
a clean per-controller folder structure.

```
swagger-tanstack-builder.config.json   ──▶   npm run codegen   ──▶   src/api/<controller>/{index,types,apis,queries,mutations}.ts
```

---

## Contents

- [Features](#features)
- [Install](#install)
- [Quick start](#quick-start)
- [Configuration](#configuration)
  - [Common response envelope](#common-response-envelope)
  - [Common error type](#common-error-type)
- [Output structure](#output-structure)
- [Generated files](#generated-files)
- [Using the generated code](#using-the-generated-code)
- [Advanced request features](#advanced-request-features)
- [Naming rules](#naming-rules)
- [Conventions & design decisions](#conventions--design-decisions)
- [Programmatic API](#programmatic-api)
- [Troubleshooting](#troubleshooting)
- [Limitations & roadmap](#limitations--roadmap)
- [Development](#development)
- [License](#license)

---

## Features

- 🗂️ **Controller-based output** — one folder per OpenAPI tag, each self-contained.
- 🪝 **TanStack Query v5** — `GET`/`HEAD` → `queryOptions`; `POST/PUT/PATCH/DELETE` → `useXxx` mutation hooks.
- 🔌 **Bring your own axios** — baseURL / auth / interceptors stay in your instance.
- 📦 **Response envelope unwrapping** — return the inner payload, not `{ data, message, … }`.
- 🚨 **Typed errors** — every hook's `error` typed as `AxiosError<YourErrorType>`.
- 🧬 **Faithful types** — `$ref`, `allOf`/`oneOf`/`anyOf`, enums, nullable, arrays, maps, binary→`Blob`.
- 📨 **Header params & file uploads** — header params via axios config; `multipart/form-data` as `FormData`.
- 🧾 **Docs preserved** — `summary` + `@deprecated` become JSDoc.
- 🔁 **Swagger 2.0 & OpenAPI 3.x**.
- 🛡️ **Safe identifiers** — reserved words and wire-name mismatches handled.

---

## Install

```bash
npm install -D swagger-tanstack-builder
```

Peer dependencies (in your app):

```bash
npm install @tanstack/react-query axios
```

| Peer dependency         | Version  |
| ----------------------- | -------- |
| `@tanstack/react-query` | `>= 5.0` |
| `axios`                 | `>= 1.0` |

Requires **Node.js ≥ 18**.

---

## Quick start

### 1. Create your axios instance

This file is **yours** — configure baseURL, auth, and interceptors here.

```ts
// src/lib/axios.ts
import axios from "axios";

export const axiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  timeout: 10_000,
});

axiosInstance.interceptors.request.use((config) => {
  const token = localStorage.getItem("accessToken");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Optional: a shared error-body type (see "Common error type")
export interface ApiError {
  result: false;
  message: string;
  errorCode: string | null;
}
```

### 2. Add the config file

Create `swagger-tanstack-builder.config.json` in your project root:

```json
{
  "url": "https://api.example.com/v3/api-docs",
  "output": "./src/api",
  "client": { "path": "@/lib/axios", "name": "axiosInstance" },
  "response": { "dataField": "data" },
  "error": { "path": "@/lib/axios", "name": "ApiError" }
}
```

### 3. Add a script and run

```json
// package.json
{ "scripts": { "codegen": "swagger-tanstack-builder" } }
```

```bash
npm run codegen
```

```
swagger-tanstack-builder
  spec   : https://api.example.com/v3/api-docs
  output : ./src/api
  client : axiosInstance from "@/lib/axios"
  generating...
  done. 13 controllers, 65 files.
```

### 4. Use it

```tsx
import { useQuery } from "@tanstack/react-query";
import { contactQueries } from "@/api/contact";

function ContactName({ id }: { id: number }) {
  const { data } = useQuery(contactQueries.getContact(id));
  return <span>{data?.name}</span>; // payload is unwrapped
}
```

---

## Configuration

The config file `swagger-tanstack-builder.config.json` is read from the directory
where the command runs (your project root).

```jsonc
{
  // Swagger/OpenAPI document URL (a local file path also works).
  "url": "https://api.example.com/v3/api-docs",

  // Output directory, relative to cwd. Wiped & regenerated on every run.
  "output": "./src/api",

  // Your axios instance.
  "client": {
    "path": "@/lib/axios",   // import path written verbatim into generated files
    "name": "axiosInstance"  // named export; omit (or "default") for a default import
  },

  // Optional: common success-envelope unwrapping.
  "response": { "dataField": "data" },

  // Optional: common error type, applied as AxiosError<T> to hooks.
  "error": { "path": "@/lib/axios", "name": "ApiError" },

  // Optional: run Prettier on output. Default true.
  "format": true
}
```

| Field                | Type      | Required | Default     | Description                                                                  |
| -------------------- | --------- | :------: | ----------- | ---------------------------------------------------------------------------- |
| `url`                | `string`  |    ✅    | —           | Swagger/OpenAPI document URL or local path. Swagger 2.0 & OpenAPI 3.x.       |
| `output`             | `string`  |    ✅    | —           | Output directory (relative to cwd). **Wiped & regenerated every run.**       |
| `client.path`        | `string`  |    ✅    | —           | Import path of your axios instance module.                                   |
| `client.name`        | `string`  |    –     | `"default"` | Named export to import. Omit for a default export.                           |
| `response.dataField` | `string`  |    –     | _(off)_     | Unwrap this envelope field as the payload. See below.                        |
| `error.path`         | `string`  |    –     | —           | Import path of your error-body type. See below.                              |
| `error.name`         | `string`  |    –     | `"default"` | Named export of the error type. Omit for a default export.                   |
| `format`             | `boolean` |    –     | `true`      | Format generated files with Prettier.                                        |

### `client.name` behavior

| Config                                               | Generated import in `apis.ts`                            |
| ---------------------------------------------------- | -------------------------------------------------------- |
| `{ "path": "@/lib/axios", "name": "axiosInstance" }` | `import { axiosInstance as client } from "@/lib/axios";` |
| `{ "path": "@/lib/axios" }` (no `name`)              | `import client from "@/lib/axios";`                      |

### Common response envelope

Most APIs wrap every response in a shared envelope:

```jsonc
// CommonResponseDetail
{ "result": true, "data": { /* the real payload */ }, "message": "OK", "errorCode": null }
```

Set `response.dataField` and generated apis unwrap it, so hooks return the
**inner payload** instead of the envelope:

```jsonc
"response": { "dataField": "data" }
```

```ts
// off  →  client.get<CommonResponseDetail>(url).then((res) => res.data);       // CommonResponseDetail
// on   →  client.get<CommonResponseDetail>(url).then((res) => res.data.data);  // Detail | undefined
```

```ts
const { data } = useQuery(contactQueries.getContact(1));
//      ^? Detail | undefined          (not CommonResponseDetail)
```

- Applied **only** to operations whose success schema actually has the field —
  `void`/`204` responses and field-less bodies are left untouched.
- The axios generic still uses the full envelope type, so unwrapping is type-safe.

### Common error type

axios always throws an `AxiosError`. Point `error` at your error-body type and
every hook's `error` becomes `AxiosError<YourType>`, applied per-hook:

```jsonc
"error": { "path": "@/lib/axios", "name": "ApiError" }
```

```ts
const { error } = useQuery(contactQueries.getContact(1));
//      ^? AxiosError<ApiError> | null
//         error.response?.data.errorCode  ✅ typed

const create = useCreateContact({
  onError: (err) => {
    //        ^? AxiosError<ApiError>
    toast(err.response?.data.message);
  },
});
```

Queries emit `queryOptions<TData, AxiosError<ApiError>>`; mutations emit
`UseMutationOptions<TData, AxiosError<ApiError>, TVars>`. When `error` is omitted,
hooks fall back to TanStack's `DefaultError`.

---

## Output structure

```
<output>/
├─ contact/                 # one folder per controller (OpenAPI tag)
│  ├─ index.ts              # barrel: re-exports the four files below
│  ├─ types.ts              # interfaces/types this controller uses
│  ├─ apis.ts               # raw axios request functions
│  ├─ queries.ts            # queryOptions object (for GET/HEAD)
│  └─ mutations.ts          # useMutation hooks (for POST/PUT/PATCH/DELETE)
├─ user/
│  └─ …
└─ group/
   └─ …
```

> There is **no** root-level barrel — each controller is imported directly from
> its folder so imports stay explicit and grep-able.

---

## Generated files

The examples below are **real output** from a Spring Boot (springdoc) API, with
`response.dataField: "data"` and `error` configured.

### `types.ts`

Every named schema reachable from the controller's operations is emitted here,
transitively. Object schemas become `interface`s; unions/enums become `type`
aliases. `description` becomes JSDoc.

```ts
// contact/types.ts
/** 공통 API 응답 엔벨롭 */
export interface CommonResponseDetail {
  result?: boolean;
  data?: Detail;
  message?: string;
  errorCode?: string | null;
}

export interface Detail {
  id?: number;
  name: string;
  status?: "ACTIVE" | "ARCHIVED" | "DELETED";
  tags?: Array<Tag>;
}
```

### `apis.ts`

Plain functions calling **your** axios instance. Argument order is:
**path params → request body → `params` object → `headers` object**.

```ts
// contact/apis.ts
import { axiosInstance as client } from "@/lib/axios";
import type { CommonResponseDetail, Create } from "./types";

/** 전화번호부 상세 조회 */
export const getContact = (contactId: number) =>
  client.get<CommonResponseDetail>(`/api/v1/contacts/${contactId}`).then((res) => res.data.data);

/** 전화번호부 생성 */
export const createContact = (body: Create) =>
  client.post<CommonResponseCreate>(`/api/v1/contacts`, body).then((res) => res.data.data);

/** 전화번호부 단건 삭제 (소프트) */
export const deleteContact = (contactId: number) =>
  client.delete<CommonResponseVoid>(`/api/v1/contacts/${contactId}`).then((res) => res.data.data);
```

### `queries.ts`

The v5 **`queryOptions`** pattern, exported as `<controller>Queries`. The
`queryKey` is `[controllerDir, operationName, ...args]`.

```ts
// contact/queries.ts
import { queryOptions } from "@tanstack/react-query";
import type { AxiosError } from "axios";
import type { ApiError } from "@/lib/axios";
import * as apis from "./apis";

export const contactQueries = {
  getContact: (contactId: number) =>
    queryOptions<Awaited<ReturnType<typeof apis.getContact>>, AxiosError<ApiError>>({
      queryKey: ["contact", "getContact", contactId],
      queryFn: () => apis.getContact(contactId),
    }),
};
```

> The options object is reusable across `useQuery`, `useSuspenseQuery`,
> `prefetchQuery`, `ensureQueryData`, `invalidateQueries`, etc.

### `mutations.ts`

One `useXxx` hook per mutating endpoint. Each accepts an optional
`UseMutationOptions` (minus `mutationFn`), so you can pass `onSuccess`,
`onError`, `retry`, … A single input is passed directly; multiple inputs are
combined into one `variables` object.

```ts
// contact/mutations.ts
import { useMutation } from "@tanstack/react-query";
import type { UseMutationOptions } from "@tanstack/react-query";
import type { AxiosError } from "axios";
import type { ApiError } from "@/lib/axios";
import * as apis from "./apis";
import type { Create, Update } from "./types";

/** 전화번호부 생성 */
export const useCreateContact = (
  options?: Omit<
    UseMutationOptions<Awaited<ReturnType<typeof apis.createContact>>, AxiosError<ApiError>, Create>,
    "mutationFn"
  >,
) =>
  useMutation({
    mutationFn: (body: Create) => apis.createContact(body),
    ...options,
  });

/** 전화번호부 수정 (path param + body) */
export const useUpdateContact = (
  options?: Omit<
    UseMutationOptions<
      Awaited<ReturnType<typeof apis.updateContact>>,
      AxiosError<ApiError>,
      { contactId: number; body: Update }
    >,
    "mutationFn"
  >,
) =>
  useMutation({
    mutationFn: ({ contactId, body }: { contactId: number; body: Update }) =>
      apis.updateContact(contactId, body),
    ...options,
  });
```

### `index.ts`

A per-controller barrel:

```ts
// contact/index.ts
export * from "./types";
export * from "./apis";
export * from "./queries";
export * from "./mutations";
```

Import from a specific file or the folder:

```ts
import { contactQueries } from "@/api/contact/queries";
// or
import { contactQueries, useCreateContact, type Detail } from "@/api/contact";
```

---

## Using the generated code

### Queries

```tsx
import { useQuery } from "@tanstack/react-query";
import { contactQueries } from "@/api/contact";

function ContactDetail({ id }: { id: number }) {
  const { data, isLoading, error } = useQuery(contactQueries.getContact(id));

  if (isLoading) return <p>로딩 중…</p>;
  if (error) return <p>{error.response?.data.message}</p>;
  return <h1>{data?.name}</h1>;
}
```

The same options work with `useSuspenseQuery`:

```tsx
const { data } = useSuspenseQuery(contactQueries.getContact(id));
//      ^? Detail (non-nullable under Suspense)
```

### Mutations

```tsx
import { useCreateContact } from "@/api/contact";

const { mutate, isPending } = useCreateContact();
mutate({ name: "홍길동", phoneNumber: "010-0000-0000" });
```

### Invalidation

```tsx
import { useQueryClient } from "@tanstack/react-query";
import { useCreateContact } from "@/api/contact";
import { contactQueries } from "@/api/contact";

function useCreateContactAndRefresh() {
  const queryClient = useQueryClient();
  return useCreateContact({
    onSuccess: () => {
      // everything under the "contact" controller
      queryClient.invalidateQueries({ queryKey: ["contact"] });
      // or one specific query
      queryClient.invalidateQueries({ queryKey: contactQueries.getContact(1).queryKey });
    },
  });
}
```

### Prefetch / SSR

```ts
import { QueryClient } from "@tanstack/react-query";
import { contactQueries } from "@/api/contact";

const queryClient = new QueryClient();
await queryClient.prefetchQuery(contactQueries.getContact(1));
```

---

## Advanced request features

### Header parameters

`in: header` parameters become a `headers` object argument, forwarded via the
axios request config. Real header names are preserved:

```ts
// GET /users/{id} with a required X-Trace-Id header
export const getUser = (id: number, headers: { "X-Trace-Id": string }) =>
  client.get<User>(`/users/${id}`, { headers }).then((res) => res.data);
```

```ts
useQuery(userQueries.getUser(1, { "X-Trace-Id": traceId }));
```

> Auth headers handled by your axios interceptor don't appear here — only header
> parameters explicitly declared in the spec.

### File uploads (`multipart/form-data`)

Binary fields become `Blob`, and the request body is assembled into a `FormData`:

```ts
export const uploadAvatar = (id: number, body: { file?: Blob; caption?: string }) => {
  const formData = new FormData();
  Object.entries(body).forEach(([key, value]) => {
    if (value === undefined || value === null) return;
    formData.append(key, value instanceof Blob ? value : String(value));
  });
  return client.post<User>(`/users/${id}/avatar`, formData).then((res) => res.data);
};
```

### Query parameters with non-identifier names

A query/header param like `page-size` keeps its **real wire name** as the object
key (so axios serializes it correctly), while remaining valid TypeScript:

```ts
export const listUsers = (params?: { "page-size"?: number }) =>
  client.get<User[]>(`/users`, { params }).then((res) => res.data);
```

---

## Naming rules

| Source                       | Result                        | Example                                  |
| ---------------------------- | ----------------------------- | ---------------------------------------- |
| Controller (OpenAPI `tag`)   | kebab-case folder             | `ContactTag` → `contact-tag/`            |
| Operation                    | camelCase from `operationId`  | `getContact` → `getContact`              |
| Operation (no `operationId`) | `method` + path segments      | `GET /users/{id}` → `getUsersId`         |
| Operation (reserved word)    | suffixed with `_`             | `delete` → `delete_`                     |
| Query export object          | `<controllerCamel>Queries`    | `contactQueries`                         |
| Mutation hook                | `use` + PascalCase(operation) | `createContact` → `useCreateContact`     |
| Schema type                  | sanitized schema name         | `Page«User»` → `PageOfUser`              |
| Query key                    | `[dir, op, ...args]`          | `["contact", "getContact", 1]`           |

---

## Conventions & design decisions

- **`GET`/`HEAD` are queries; everything else is a mutation.**
- **Argument order:** path params → request body → `params` object → `headers` object.
- **`params`/`headers` objects are optional** only when every contained parameter is optional.
- **Responses** use the first `2xx` response's `application/json` schema (falls back to `default`, then `void`).
- **Multi-tag operations** are emitted into **every** controller they're tagged with (matching how Swagger UI groups them).
- **Per-controller, self-contained types.** A schema referenced by two controllers is generated in **both** `types.ts` files — keeps each folder independent, at the cost of some duplication.
- **The output directory is wiped on every run** so deletions in the spec propagate. Never hand-edit generated files — they carry an `AUTO-GENERATED` header.

---

## Programmatic API

```ts
import { generateFromConfig, generate } from "swagger-tanstack-builder";

// read swagger-tanstack-builder.config.json from cwd
await generateFromConfig();

// or pass a fully-resolved config
await generate({
  url: "https://api.example.com/v3/api-docs",
  output: "./src/api",
  outputDir: "/abs/path/src/api",
  client: { path: "@/lib/axios", name: "axiosInstance" },
  response: { dataField: "data" },
  error: { path: "@/lib/axios", name: "ApiError" },
  format: true,
});
```

---

## Troubleshooting

**“config not found”** — the file must be named exactly
`swagger-tanstack-builder.config.json` and live in the directory you run the
command from.

**I only have the Swagger UI URL** — the machine-readable spec is served
separately. For springdoc (Spring Boot) it's usually `https://<host>/v3/api-docs`.
Open it in a browser; if you see JSON, that's your `url`.

**`data` is `T | undefined` after unwrapping** — the envelope's `data` field is
optional in your spec, so the unwrapped type is too. Narrow it (`data?.x`) or
mark the field required in the API.

**A controller is named `default`** — those operations have no `tags` in the
spec. Add tags to group them.

**Imports use `@/…` but don't resolve** — `client.path`/`error.path` are written
verbatim. Make sure your `tsconfig.json` `paths` (and bundler) define the alias.

---

## Limitations & roadmap

- No per-query option injection yet (use `useQuery({ ...queries.x(id), enabled })` for now).
- No `infiniteQueryOptions` generation for paginated endpoints.
- Enums are string-literal unions (no `enum`/`as const` object option).
- One success media type (`application/json`) per response.

---

## Development

```bash
npm install
npm run typecheck     # tsc --noEmit
npm test              # vitest run
npm run build         # bundle to dist/ via tsup (ESM + .d.ts + bin shebang)
npm run dev           # tsup --watch
```

The test suite covers the case helpers, the JSON-Schema→TS converter, and an
end-to-end parse-and-generate over a fixture spec (controllers, queries,
mutations, unwrapping, error types, headers, multipart, reserved words, multi-tag,
and Swagger 2.0).

---

## License

MIT
