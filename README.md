# swagger-to-tanstack-query — monorepo

A [pnpm workspaces](https://pnpm.io/workspaces) monorepo for **swagger-to-tanstack-query**: a
code generator that turns a Swagger/OpenAPI spec into typed TanStack Query code, plus its
documentation + interactive playground site.

```
.
├── packages/
│   └── swagger-to-tanstack-query/   # the published npm package (CLI + library)
└── apps/
    └── docs/                        # Astro + React docs site & live playground
```

## Packages

| Path                                   | Name                                                  | What it is                                                        |
| -------------------------------------- | ----------------------------------------------------- | ----------------------------------------------------------------- |
| `packages/swagger-to-tanstack-query`   | [`swagger-to-tanstack-query`](packages/swagger-to-tanstack-query/README.md) | The codegen CLI + programmatic API. Published to npm.             |
| `apps/docs`                            | `docs` (private)                                      | Documentation site and browser playground. Deployed to Vercel.    |

The package exposes two entry points:

- `swagger-to-tanstack-query` — the full Node API (`generate`, `generateFromConfig`) and the CLI.
- `swagger-to-tanstack-query/core` — a **browser-safe**, environment-free subset (`parseSpec`,
  `generateFiles`, the generators and types) with no `node:`, filesystem, or Prettier imports.
  The docs playground imports this to run the real generator entirely in the browser.

## Develop

Requires **Node ≥ 18** and **pnpm**.

```bash
pnpm install            # install all workspaces

pnpm dev                # run every package's dev task in parallel
pnpm dev:docs           # just the docs site (http://localhost:4321)
pnpm build:core         # build only the package (refreshes its dist)

pnpm build              # build everything, in dependency order (package → docs)
pnpm test               # run all package tests
pnpm typecheck          # type-check every workspace
```

The docs site consumes the package's built `dist/`, so `pnpm build` builds the package first
(pnpm resolves the topological order). When iterating on the generator while the docs dev server
runs, also run the package in watch mode (`pnpm --filter swagger-to-tanstack-query dev`).

## Deploy (docs → Vercel)

`vercel.json` at the repo root configures a monorepo deploy:

- **Install**: `pnpm install`
- **Build**: `pnpm -r build` (builds the package, then the docs site)
- **Output**: `apps/docs/dist` (static)

Point the Vercel project at the repository root; the config does the rest.

## License

MIT
