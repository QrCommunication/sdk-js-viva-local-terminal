# CLAUDE.md — @qrcommunication/viva-local-terminal-sdk

Guidance for AI agents and contributors working on this SDK.

## What this package is

A TypeScript SDK for the **Viva.com Local Terminal API** (`/pos/v1/`). It is a
**peer-to-peer (P2P)** client: it talks **directly to an EFT POS terminal over
the LAN**. There is:

- **No Viva cloud endpoint** — the base URL is the terminal's own `IP:port`.
- **No authentication** — never add an `Authorization` header. The spec
  explicitly forbids it for the closed-network P2P model.
- **Self-signed TLS** — the terminal serves HTTPS with a self-signed cert.
- **Plain-string 400 errors** — the API returns a raw string body on 400, not
  JSON. `ApiError` preserves it verbatim.

This is the TypeScript twin of the PHP SDK
`sdk-php-viva-local-terminal` (`QrCommunication\VivaLocalTerminal`). Keep the two
in functional parity: same resources, same methods, same transport semantics.

## Architecture

```
src/
  client.ts              VivaLocalTerminalClient — entry point, wires resources
  config.ts              VivaLocalTerminalConfig — URL building, TLS, ISV toggle
  http.ts                HttpClient — fetch transport, undici Agent for self-signed TLS
  errors.ts              VivaError / ApiError (preserve raw string bodies)
  enums.ts               PaymentMethod, SessionState, SessionType, TransactionTypeId
  resources/
    transactions.ts      sale, capturePreauth, refund, unreferencedRefund,
                         abort, aadeFimControl, retrieve
    sessions.ts          get
    device.ts            screenControl, brightness
  types/                 request param + response shapes
```

## Hard rules (do not break)

1. **Never send an `Authorization` header.** The P2P protocol is unauthenticated.
2. **Amounts are integers in cents.** No float euros anywhere.
3. **Preserve the raw 400 string body.** `ApiError.message` must be the verbatim
   terminal text; `responseBody` keeps `{ raw }` when the body isn't JSON.
4. **TLS toggle lives in transport.** Disabling verification (`verifyTls: false`)
   wires an `undici` Agent with `rejectUnauthorized: false`. Default stays
   `verifyTls: true`.
5. **ISV variants differ only by a trailing slash.** `useIsvEndpoints` controls
   it globally via `Config.url()`.
6. **`strict` TypeScript, no `any` in public APIs.** `noUncheckedIndexedAccess`
   is on.

## Commands

```bash
pnpm install
pnpm typecheck      # tsc --noEmit
pnpm test           # vitest run (mock fetch, one test per method)
pnpm build          # tsup -> ESM + CJS + d.ts
pnpm format         # prettier write
pnpm format:check   # prettier check (CI gate)
```

## Testing conventions

- Use `tests/support/mock-fetch.ts` to fake `fetch`. It records requests and can
  return both JSON bodies and **raw string** bodies (`rawBody`) to exercise the
  400-string path.
- Cover one test per resource method, plus the transport behaviors: no-auth
  header, raw-string error parsing, unreachable terminal (`httpStatus === 0`),
  and the TLS dispatcher attach/skip.

## Release

- Bump `version` in `package.json` + add a `CHANGELOG.md` entry, then push a
  `vX.Y.Z` tag.
- `.github/workflows/release.yml` publishes to npm via **OIDC Trusted
  Publishing** on **Node 24** (npm 11+ — required for OIDC). No `NPM_TOKEN`.
