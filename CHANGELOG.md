# Changelog

All notable changes to this project are documented here. The format is based on
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this project
adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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
