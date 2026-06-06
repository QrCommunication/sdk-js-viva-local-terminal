# AGENTS.md

Operational notes for autonomous agents working in this repository. For the full
architectural contract, read `CLAUDE.md`.

## TL;DR

- Package: `@qrcommunication/viva-local-terminal-sdk` — TypeScript SDK for the
  **Viva.com Local Terminal API** (`/pos/v1/`).
- Transport: **peer-to-peer over the LAN**. Base URL = terminal `IP:port`.
  **No cloud, no auth header, self-signed TLS, plain-string 400 errors.**
- Parity source: the PHP SDK `sdk-php-viva-local-terminal`. Keep methods aligned.

## Setup & checks (run before claiming done)

```bash
pnpm install
pnpm typecheck && pnpm test && pnpm build && pnpm format:check
```

All four must be green. `pnpm test` mocks `fetch` — no real terminal required.

## Where things live

| Concern | File |
| --- | --- |
| Entry point | `src/client.ts` |
| URL building, TLS, ISV toggle | `src/config.ts` |
| fetch transport + undici TLS Agent | `src/http.ts` |
| Errors (raw string preservation) | `src/errors.ts` |
| Enums | `src/enums.ts` |
| Resources | `src/resources/{transactions,sessions,device}.ts` |
| Request/response types | `src/types/` |
| Tests + mock fetch | `tests/` |

## Invariants to never violate

1. No `Authorization` header — ever.
2. Amounts in integer cents.
3. `ApiError` carries the verbatim 400 string body.
4. `verifyTls: false` → undici Agent with `rejectUnauthorized: false`; default
   is `true`.
5. ISV endpoints = trailing slash via `useIsvEndpoints`.

## Adding a new endpoint

1. Add the param/response type in `src/types/`.
2. Add the method to the right resource class, routing through `this.http`.
3. Export any new enum/type from `src/index.ts`.
4. Add one mock-fetch test per method (assert URL, method, body/query shape).
5. Update `README.md` API table and `CHANGELOG.md`.
