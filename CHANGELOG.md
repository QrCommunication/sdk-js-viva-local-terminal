# Changelog

All notable changes to this project are documented here. The format is based on
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this project
adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.2] - 2026-10-29

### Changed (dev tooling)

- `vitest` / `@vitest/coverage-v8` 3.2 → 5.0, `tsup` 8.5 → 9.0; transitive
  refresh. Closes the dev-only advisories (tinypool, vite, postcss, nanoid,
  brace-expansion): `pnpm audit` 28 → 0.
- Runtime dependency `undici` stays on `^6.29.1` (no known advisory): undici 7
  needs Node ≥ 20.18 and undici 8 Node ≥ 22.19, while this SDK supports
  Node ≥ 18.17. `@types/node` stays on 22 (its `undici-types` must match undici 6).
- `typescript` stays on 6.0: TypeScript 7 ships no compiler API, which tsup's
  declaration build requires.

## [1.0.1] - 2026-06-06

### Changed

- First release published through the CI pipeline (npm OIDC Trusted Publishing,
  Node 24). No API or runtime changes versus 1.0.0.

## [1.0.0] - 2026-06-06

### Added

- Initial release of `@qrcommunication/viva-local-terminal-sdk`.
- `VivaLocalTerminalClient` — peer-to-peer (P2P) client that talks directly to
  an EFT POS terminal over the LAN (no cloud endpoint, no authentication).
- `transactions` resource: `sale`, `capturePreauth`, `refund`,
  `unreferencedRefund`, `abort`, `aadeFimControl`, `retrieve`.
- `sessions` resource: `get` (poll a session for its final outcome).
- `device` resource: `screenControl`, `brightness`.
- TLS-aware transport: when `verifyTls: false`, an `undici` `Agent` is wired
  automatically so the terminal's self-signed certificate is accepted (the
  native `fetch` API has no per-call TLS toggle). A custom `dispatcher` can also
  be supplied.
- ISV endpoint support via `useIsvEndpoints` (trailing-slash path variants).
- `ApiError` / `VivaError` that preserve the terminal's **plain-string** 400
  error bodies verbatim.
- Enums: `PaymentMethod`, `SessionState`, `SessionType`, `TransactionTypeId`.
- ESM + CommonJS builds with full TypeScript declarations.
