# swagger-tanstack-builder

> Swagger/OpenAPI spec → **TanStack Query** code generator, split by **controller**.

Point it at a Swagger URL, run one npm script, and get fully-typed **APIs**,
**`queryOptions`**, and **`useMutation`** hooks — using **your own axios instance**.

- 🗂️ **Controller-based output** — one folder per OpenAPI tag, each self-contained.
- 🪝 **TanStack Query v5** — `GET` → `queryOptions`, `POST/PUT/PATCH/DELETE` → `useXxx` mutation hooks.
- 🔌 **Bring your own axios** — baseURL / auth / interceptors stay in your instance.
- 🧬 **Real types** — `$ref`, `allOf`/`oneOf`/`anyOf`, enums, nullable, arrays, maps.
- 🧾 **Docs preserved** — `summary`/`description` from the spec become JSDoc.
- 🔁 **Swagger 2.0 & OpenAPI 3.x** supported.

---

## Table of contents

- [Install](#install)
- [Quick start](#quick-start)
- [Configuration](#configuration)
- [Output structure](#output-structure)
- [What gets generated](#what-gets-generated)
  - [`types.ts`](#typests)
  - [`apis.ts`](#apists)
  - [`queries.ts`](#queriests)
  - [`mutations.ts`](#mutationsts)
  - [`index.ts`](#indexts)
- [Usage in your app](#usage-in-your-app)
  - [Queries](#queries)
  - [Mutations](#mutations)
  - [Query invalidation](#query-invalidation)
  - [Prefetching / SSR](#prefetching--ssr)
- [How it works](#how-it-works)
- [Naming rules](#naming-rules)
- [Conventions & design decisions](#conventions--design-decisions)
- [FAQ](#faq)
- [Development](#development)

---

## Install

```bash
npm install -D swagger-tanstack-builder
```

Peer dependencies (installed in your app):

```bash
npm install @tanstack/react-query axios
```

| Peer dependency           | Version  |
| ------------------------- | -------- |
| `@tanstack/react-query`   | `>= 5.0` |
| `axios`                   | `>= 1.0` |

---

## Quick start

### 1. Create your axios instance

This is **yours** — baseURL, auth headers, and interceptors all live here.

```ts
// src/lib/axios.ts
import axios from "axios";

export const axiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  timeout: 10_000,
});

// e.g. attach an auth token
axiosInstance.interceptors.request.use((config) => {
  const token = localStorage.getItem("accessToken");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});
```

### 2. Add the config file

Create `swagger-tanstack-builder.config.json` in your project root:

```json
{
  "url": "https://api.example.com/v3/api-docs",
  "output": "./src/api",
  "client": {
    "path": "@/lib/axios",
    "name": "axiosInstance"
  }
}
```

### 3. Add a script and run it

```json
// package.json
{
  "scripts": {
    "codegen": "swagger-tanstack-builder"
  }
}
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
import { contactQueries } from "@/api/contact/queries";

function ContactName({ id }: { id: number }) {
  const { data } = useQuery(contactQueries.getContact(id));
  return <span>{data?.data?.name}</span>;
}
```

---

## Configuration

The config file is `swagger-tanstack-builder.config.json` in the directory where
you run the command (your project root).

```jsonc
{
  // Swagger/OpenAPI document URL. A local file path also works.
  "url": "https://api.example.com/v3/api-docs",

  // Output directory, relative to the current working directory.
  "output": "./src/api",

  // Your axios instance.
  "client": {
    // Import path written verbatim into generated files.
    "path": "@/lib/axios",
    // Named export to use. Omit (or "default") for a default import.
    "name": "axiosInstance"
  },

  // Common success-envelope handling (optional).
  "response": {
    // Unwrap this field so apis return the inner payload (res.data.data).
    "dataField": "data"
  },

  // Common error type, applied as AxiosError<T> to hooks (optional).
  "error": {
    "path": "@/lib/axios",
    "name": "ApiError"
  },

  // Run Prettier over generated files. Default: true.
  "format": true
}
```

| Field                  | Type      | Required | Default     | Description                                                                 |
| ---------------------- | --------- | :------: | ----------- | --------------------------------------------------------------------------- |
| `url`                  | `string`  |    ✅    | —           | Swagger/OpenAPI document URL or local path. Swagger 2.0 & OpenAPI 3.x.      |
| `output`               | `string`  |    ✅    | —           | Output directory (relative to cwd). **Wiped & regenerated every run.**      |
| `client.path`          | `string`  |    ✅    | —           | Import path of your axios instance module.                                  |
| `client.name`          | `string`  |    –     | `"default"` | Named export to import. Omit for a default export.                          |
| `response.dataField`   | `string`  |    –     | _(off)_     | Unwrap this envelope field as the payload. See [Common response envelope](#common-response-envelope). |
| `error.path`           | `string`  |    –     | —           | Import path of your error-body type. See [Common error type](#common-error-type). |
| `error.name`           | `string`  |    –     | `"default"` | Named export of the error type. Omit for a default export.                  |
| `format`               | `boolean` |    –     | `true`      | Format output with Prettier.                                                |

### Common response envelope

Most APIs wrap every response in a shared envelope:

```jsonc
// CommonResponseDetail
{ "result": true, "data": { /* the real payload */ }, "message": "OK", "errorCode": null }
```

Set `response.dataField` to the payload field and generated apis unwrap it, so
your hooks return the **inner payload** instead of the envelope:

```jsonc
"response": { "dataField": "data" }
```

```ts
// before  →  client.get<CommonResponseDetail>(url).then((res) => res.data);
// after   →  client.get<CommonResponseDetail>(url).then((res) => res.data.data);
```

```ts
const { data } = useQuery(contactQueries.getContact(1));
//      ^? Detail | undefined          (not CommonResponseDetail)
```

- Only applied to operations whose success schema **actually has** the field —
  others (e.g. `void` deletes) are left untouched.
- The axios generic still uses the full envelope type, so unwrapping is type-safe.

### Common error type

axios always throws an `AxiosError`. Point `error` at your error-body type and
every hook's `error` becomes `AxiosError<YourType>`:

```jsonc
"error": { "path": "@/lib/axios", "name": "ApiError" }
```

```ts
// @/lib/axios.ts
export interface ApiError {
  result: false;
  message: string;
  errorCode: string | null;
}
```

```ts
const { error } = useQuery(contactQueries.getContact(1));
//      ^? AxiosError<ApiError> | null
//         error.response?.data.errorCode  ✅ typed

const create = useCreateContact({
  onError: (err) => {
    //        ^? AxiosError<ApiError>
    console.log(err.response?.data.message);
  },
});
```

The type is applied explicitly per hook — `queryOptions<TData, AxiosError<ApiError>>`
for queries and `UseMutationOptions<TData, AxiosError<ApiError>, TVars>` for
mutations. When `error` is omitted, hooks fall back to TanStack's `DefaultError`.

### `client.name` behavior

| Config                                              | Generated import in `apis.ts`                       |
| --------------------------------------------------- | --------------------------------------------------- |
| `{ "path": "@/lib/axios", "name": "axiosInstance" }`| `import { axiosInstance as client } from "@/lib/axios";` |
| `{ "path": "@/lib/axios" }` (no `name`)             | `import client from "@/lib/axios";`                 |

### Finding your spec URL

If you only have the Swagger **UI** URL (e.g. `…/swagger-ui/index.html`), the
machine-readable spec is served separately. For **springdoc** (Spring Boot) it is
usually:

```
https://<host>/v3/api-docs
```

Open that URL in a browser — if you see JSON, that's your `url`.

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

> There is **no** root-level `index.ts` barrel — each controller is consumed
> directly from its folder so imports stay explicit and grep-able.

---

## What gets generated

The examples below are **real output** from a Spring Boot (springdoc) API.

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
  phoneNumber?: string;
  tags?: Array<Tag>;
  status?: "ACTIVE" | "ARCHIVED" | "DELETED";
}

export interface Pageable {
  page?: number;
  size?: number;
  sort?: Array<string>;
}
```

### `apis.ts`

Plain functions that call **your** axios instance and unwrap `res.data`.
Argument order is: **path params → request body → query params object**.

```ts
// contact/apis.ts
import { axiosInstance as client } from "@/lib/axios";
import type { CommonResponseDetail, Create, Pageable } from "./types";

/** 전화번호부 검색 */
export const searchContacts = (params: {
  searchKeyword?: string;
  isFavorite?: boolean;
  pageable: Pageable;
}) =>
  client
    .get<CommonResponseContactSearchListResponse>(`/api/v1/contacts`, { params })
    .then((res) => res.data);

/** 전화번호부 생성 */
export const createContact = (body: Create) =>
  client.post<CommonResponseCreate>(`/api/v1/contacts`, body).then((res) => res.data);

/** 전화번호부 상세 조회 */
export const getContact = (contactId: number) =>
  client.get<CommonResponseDetail>(`/api/v1/contacts/${contactId}`).then((res) => res.data);

/** 전화번호부 단건 삭제 (소프트) */
export const deleteContact = (contactId: number) =>
  client.delete<CommonResponseVoid>(`/api/v1/contacts/${contactId}`).then((res) => res.data);
```

| HTTP method        | axios call                                  |
| ------------------ | ------------------------------------------- |
| `GET` / `DELETE`   | `client.get/delete(url, { params })`        |
| `POST/PUT/PATCH`   | `client.post/put/patch(url, body, { params })` |

### `queries.ts`

Built with the v5 **`queryOptions`** pattern. Exported as a single object named
`<controller>Queries`. The `queryKey` is `[controllerDir, operationName, ...args]`.

```ts
// contact/queries.ts
import { queryOptions } from "@tanstack/react-query";
import * as apis from "./apis";
import type { Pageable } from "./types";

export const contactQueries = {
  searchContacts: (params: { searchKeyword?: string; pageable: Pageable }) =>
    queryOptions({
      queryKey: ["contact", "searchContacts", params],
      queryFn: () => apis.searchContacts(params),
    }),

  getContact: (contactId: number) =>
    queryOptions({
      queryKey: ["contact", "getContact", contactId],
      queryFn: () => apis.getContact(contactId),
    }),
};
```

> **Why `queryOptions`?** It's the recommended v5 pattern: the options object is
> reusable across `useQuery`, `useSuspenseQuery`, `queryClient.prefetchQuery`,
> `ensureQueryData`, `invalidateQueries`, etc. — all fully typed, no duplication.

### `mutations.ts`

One `useXxx` hook per mutating endpoint. When a mutation has a single input it's
passed directly; with multiple inputs they're combined into one `variables`
object. Every hook accepts an **optional `UseMutationOptions`** argument (minus
`mutationFn`), so you can pass `onSuccess`, `onError`, `retry`, etc.

```ts
// contact/mutations.ts
import { useMutation } from "@tanstack/react-query";
import type { DefaultError, UseMutationOptions } from "@tanstack/react-query";
import * as apis from "./apis";
import type { Create, Update } from "./types";

/** 전화번호부 생성 */
export const useCreateContact = (
  options?: Omit<
    UseMutationOptions<Awaited<ReturnType<typeof apis.createContact>>, DefaultError, Create>,
    "mutationFn"
  >,
) =>
  useMutation({
    mutationFn: (body: Create) => apis.createContact(body),
    ...options,
  });

/** 전화번호부 수정 (path param + body → variables object) */
export const useUpdateContact = (
  options?: Omit<
    UseMutationOptions<
      Awaited<ReturnType<typeof apis.updateContact>>,
      DefaultError,
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

> The verbose `Omit<UseMutationOptions<…>, "mutationFn">` simply means: *"all the
> normal `useMutation` options, except you can't override `mutationFn`."* `TData`
> is inferred from the api function and `TVariables` from the endpoint inputs.

### `index.ts`

A per-controller barrel re-exporting all four files:

```ts
// contact/index.ts
export * from "./types";
export * from "./apis";
export * from "./queries";
export * from "./mutations";
```

So you can import either from the specific file or the folder:

```ts
import { contactQueries } from "@/api/contact/queries";
// or
import { contactQueries, useCreateContact, type Detail } from "@/api/contact";
```

---

## Usage in your app

### Queries

```tsx
import { useQuery } from "@tanstack/react-query";
import { contactQueries } from "@/api/contact";

function ContactDetail({ id }: { id: number }) {
  const { data, isLoading, error } = useQuery(contactQueries.getContact(id));

  if (isLoading) return <p>로딩 중…</p>;
  if (error) return <p>에러 발생</p>;
  return <h1>{data?.data?.name}</h1>;
}
```

With `useSuspenseQuery` — the **same** `queryOptions` work:

```tsx
import { useSuspenseQuery } from "@tanstack/react-query";
import { contactQueries } from "@/api/contact";

function ContactDetail({ id }: { id: number }) {
  const { data } = useSuspenseQuery(contactQueries.getContact(id));
  return <h1>{data.data?.name}</h1>; // data is non-nullable under Suspense
}
```

### Mutations

```tsx
import { useCreateContact } from "@/api/contact";

function CreateButton() {
  const { mutate, isPending } = useCreateContact();

  return (
    <button
      disabled={isPending}
      onClick={() => mutate({ name: "홍길동", phoneNumber: "010-0000-0000" })}
    >
      연락처 추가
    </button>
  );
}
```

Multi-input mutation (path param + body):

```tsx
import { useUpdateContact } from "@/api/contact";

const { mutate } = useUpdateContact();
mutate({ contactId: 1, body: { name: "새 이름" } });
```

### Query invalidation

Because query keys are stable and structured, you can invalidate precisely:

```tsx
import { useQueryClient } from "@tanstack/react-query";
import { useCreateContact } from "@/api/contact";

function useCreateContactAndRefresh() {
  const queryClient = useQueryClient();
  return useCreateContact({
    onSuccess: () => {
      // invalidate everything under the "contact" controller
      queryClient.invalidateQueries({ queryKey: ["contact"] });
    },
  });
}
```

> The generated hooks accept the usual TanStack options
> (`onSuccess`, `onError`, …) — they're plain `useMutation` wrappers.

Invalidate one specific query:

```tsx
import { contactQueries } from "@/api/contact";

queryClient.invalidateQueries({
  queryKey: contactQueries.getContact(id).queryKey, // ["contact", "getContact", id]
});
```

### Prefetching / SSR

```tsx
import { QueryClient } from "@tanstack/react-query";
import { contactQueries } from "@/api/contact";

const queryClient = new QueryClient();
await queryClient.prefetchQuery(contactQueries.getContact(1));
```

---

## How it works

```
swagger-tanstack-builder.config.json
        │  (url, output, client)
        ▼
  ① fetch + bundle spec        (Swagger 2.0 / OpenAPI 3.x; external $refs resolved,
        │                        internal $refs kept so named types survive)
        ▼
  ② parse → internal model     (group operations by tag → controllers;
        │                        resolve params, request body, success response)
        ▼
  ③ generate code              (types.ts / apis.ts / queries.ts / mutations.ts / index.ts)
        │
        ▼
  ④ Prettier + write to <output>/
```

You can also run it programmatically:

```ts
import { generateFromConfig, generate } from "swagger-tanstack-builder";

// read swagger-tanstack-builder.config.json from cwd
await generateFromConfig();

// or pass a fully-resolved config object
await generate({
  url: "https://api.example.com/v3/api-docs",
  output: "./src/api",
  outputDir: "/abs/path/src/api",
  client: { path: "@/lib/axios", name: "axiosInstance" },
  format: true,
});
```

---

## Naming rules

| Source                         | Result                          | Example                                  |
| ------------------------------ | ------------------------------- | ---------------------------------------- |
| Controller (OpenAPI `tag`)     | kebab-case folder               | `ContactTag` → `contact-tag/`            |
| Operation                      | camelCase from `operationId`    | `getContact` → `getContact`              |
| Operation (no `operationId`)   | `method` + path segments        | `GET /users/{id}` → `getUsersId`         |
| Query export object            | `<controllerCamel>Queries`      | `contactQueries`                         |
| Mutation hook                  | `use` + PascalCase(operation)   | `createContact` → `useCreateContact`     |
| Schema type                    | sanitized schema name           | `Page«User»` → `PageOfUser`              |
| Query key                      | `[dir, op, ...args]`            | `["contact", "getContact", 1]`           |

---

## Conventions & design decisions

- **`GET`/`HEAD` are queries; everything else is a mutation.**
- **Argument order** in api functions and query factories: path params →
  request body (`body`) → query params (`params` object).
- **`params` is optional** only when every query parameter is optional.
- **Responses** use the first `2xx` response's `application/json` schema (falls
  back to `default`, then `void`).
- **Per-controller, self-contained types.** A schema referenced by two
  controllers is generated in **both** `types.ts` files. This keeps each folder
  independent and copy-pasteable, at the cost of some duplication.
- **The output directory is wiped on every run** so deletions in the spec
  propagate. Never hand-edit generated files — they carry an
  `AUTO-GENERATED` header.

---

## FAQ

**Can I use a different HTTP client (fetch, ky)?**
No — axios is fixed by design. But the instance is yours, so you control
baseURL, headers, interceptors, retries, etc.

**Why is the response type wrapped (e.g. `CommonResponseDetail`)?**
That's your API's response envelope from the spec. Set
[`response.dataField`](#common-response-envelope) to unwrap it and have hooks
return the inner payload directly.

**How are shared models handled?**
They are duplicated into each controller's `types.ts` (see design decisions).

**Does it support error types?**
Yes — set [`error`](#common-error-type) to type every hook's `error` as
`AxiosError<YourType>`. Without it, hooks use TanStack's `DefaultError`.

**Swagger 2.0?**
Yes — `definitions`, `in: "body"` parameters, and `responses[code].schema` are
all handled alongside OpenAPI 3.x.

---

## Development

```bash
npm install
npm run typecheck     # tsc --noEmit
npm run build         # bundle to dist/ via tsup (ESM + .d.ts + bin shebang)
npm run dev           # tsup --watch
```

Manual end-to-end check:

```bash
mkdir -p /tmp/stb && cd /tmp/stb
cat > swagger-tanstack-builder.config.json <<'JSON'
{ "url": "https://petstore3.swagger.io/api/v3/openapi.json",
  "output": "./generated",
  "client": { "path": "@/lib/axios", "name": "axiosInstance" } }
JSON
node /path/to/swagger-tanstack-builder/dist/cli.js
```

---

## License

MIT
