# @qrcommunication/viva-local-terminal-sdk

TypeScript SDK for the **Viva.com Local Terminal API** (`/pos/v1/`).

> [!IMPORTANT]
> This SDK is **peer-to-peer (P2P)**. It talks **directly to an EFT POS card
> terminal over your local network** — there is **no Viva cloud endpoint** and
> **no authentication**. You address the terminal's own IP address and port.

[![npm](https://img.shields.io/npm/v/@qrcommunication/viva-local-terminal-sdk.svg)](https://www.npmjs.com/package/@qrcommunication/viva-local-terminal-sdk)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](./LICENSE)

---

## The P2P model in one minute

Unlike the Viva.com cloud APIs (`api.vivapayments.com`, OAuth2), the Local
Terminal API is a **closed-network protocol**:

| Cloud APIs | **Local Terminal API (this SDK)** |
| --- | --- |
| `https://api.vivapayments.com` | `https://<terminal-ip>:<port>` (the device itself) |
| OAuth2 / API key auth | **No authentication at all** |
| Public CA TLS | **Self-signed terminal certificate** |
| JSON errors | **Plain-string error bodies on 400** |

The official Viva documentation states verbatim:

> _"In a closed network environment, authentication is not required for
> peer-to-peer communication. [...] eliminating the need to include an
> Authorization tag in the header."_

This SDK reproduces that model faithfully: requests go straight to the terminal,
carry **no `Authorization` header**, and the transport is TLS-aware for the
terminal's self-signed certificate.

---

## Network prerequisites

1. Your application host (POS / ECR / kiosk) and the terminal are on the **same
   LAN / VLAN**, with no firewall blocking the terminal's HTTPS port.
2. You know the terminal's **IP address and port**. Discover it via:
   - the terminal's on-device network settings screen, or
   - your router/DHCP lease table, or
   - mDNS / Bonjour / `zeroconf` discovery on the subnet.
3. The terminal serves **HTTPS with a self-signed certificate**. You either:
   - pass `verifyTls: false` (accepting the closed-LAN trust model — the common
     case), or
   - install the terminal's CA in your host's trust store and keep
     `verifyTls: true`.

---

## Installation

```bash
pnpm add @qrcommunication/viva-local-terminal-sdk
# or: npm install / yarn add
```

- **Node 18+** (uses the global `fetch`; bundles `undici` for the self-signed
  TLS path). Also works in any runtime with a global `fetch`.
- ESM and CommonJS builds are both shipped.

---

## Quick start

```ts
import { VivaLocalTerminalClient } from "@qrcommunication/viva-local-terminal-sdk";
import { randomUUID } from "node:crypto";

const terminal = new VivaLocalTerminalClient({
  terminalBaseUrl: "https://192.168.1.50:8080", // the terminal's IP + port
  verifyTls: false, // self-signed terminal cert on a trusted closed LAN
});

// 1. Start a sale. Amounts are ALWAYS integers in cents.
const sessionId = randomUUID(); // you generate the session UUID
const started = await terminal.transactions.sale({
  sessionId,
  amount: 1170, // 11.70 EUR
  currencyCode: 978, // EUR (ISO 4217 numeric)
  merchantReference: "order-123",
});
// started.state === "PROCESSING"

// 2. The terminal is now waiting for the card. Poll the session for the outcome.
const session = await terminal.sessions.get(sessionId);
// session.state === "SUCCESS" once the cardholder has paid
// session.payloadData holds the full transaction details once completed

// 3. Control the physical device.
await terminal.device.screenControl(true); // wake + lock the screen
await terminal.device.brightness(0.5); // (0, 1]
```

### Polling helper

The terminal returns `PROCESSING` immediately; poll until the session resolves:

```ts
import { SessionState } from "@qrcommunication/viva-local-terminal-sdk";

async function waitForOutcome(client, sessionId, timeoutMs = 120_000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    const session = await client.sessions.get(sessionId);
    if (
      session.state === SessionState.SUCCESS ||
      session.state === SessionState.FAILURE
    ) {
      return session;
    }
    await new Promise((r) => setTimeout(r, 1500));
  }
  throw new Error("Timed out waiting for the terminal");
}
```

---

## TLS for self-signed terminal certificates

The native `fetch` API has **no per-call TLS toggle**. On Node, this SDK
therefore wires an [`undici`](https://github.com/nodejs/undici) `Agent` with
`connect.rejectUnauthorized = false` automatically whenever `verifyTls: false`:

```ts
new VivaLocalTerminalClient({
  terminalBaseUrl: "https://192.168.1.50:8080",
  verifyTls: false, // -> undici Agent accepts the self-signed cert
});
```

Prefer to keep verification on? Install the terminal's CA in the host trust
store (e.g. `NODE_EXTRA_CA_CERTS=/path/to/terminal-ca.pem`) and leave
`verifyTls: true` (the default). You can also pass your own `undici` dispatcher:

```ts
import { Agent } from "undici";

new VivaLocalTerminalClient({
  terminalBaseUrl: "https://192.168.1.50:8080",
  dispatcher: new Agent({ connect: { ca: myTerminalCaPem } }),
});
```

> Disabling TLS verification is only acceptable on a **trusted, closed LAN** —
> exactly the deployment model the Local Terminal API is designed for. Never
> point this SDK at a host reachable from the public internet with
> `verifyTls: false`.

---

## ISV vs merchant endpoints

The ISV (Independent Software Vendor) endpoint variants differ only by a
**trailing slash** (e.g. `/pos/v1/sale/`). Enable them globally:

```ts
const terminal = new VivaLocalTerminalClient({
  terminalBaseUrl: "https://192.168.1.50:8080",
  useIsvEndpoints: true, // sale/refund hit `/pos/v1/sale/` and accept isvDetails
});

await terminal.transactions.sale({
  sessionId,
  amount: 1170,
  isvDetails: { sourceCode: "your-isv-source" },
});
```

---

## API surface

### `transactions`

| Method | Endpoint | Purpose |
| --- | --- | --- |
| `sale(params)` | `POST /pos/v1/sale` | Start a sale (or pre-authorization). |
| `capturePreauth(params)` | `POST /pos/v1/preauth-completion` | Capture a pre-authorized sale. |
| `refund(params)` | `POST /pos/v1/refund` | Referenced refund / cancellation. |
| `unreferencedRefund(params)` | `POST /pos/v1/unreferenced-refund` | Refund not linked to an original txn. |
| `abort(sessionId)` | `POST /pos/v1/abort` | Abort an in-progress SALE session. |
| `aadeFimControl(token)` | `POST /pos/v1/aade-fim-control` | Greek AADE FIM control action. |
| `retrieve(params?)` | `GET /pos/v1/transactions` | List historical transactions. |

### `sessions`

| Method | Endpoint | Purpose |
| --- | --- | --- |
| `get(sessionId)` | `GET /pos/v1/sessions/{id}` | Poll a session for its final outcome. |

### `device`

| Method | Endpoint | Purpose |
| --- | --- | --- |
| `screenControl(wakeUpLock)` | `POST /pos/v1/awake-lock` | Wake / lock the screen. |
| `brightness(value)` | `POST /pos/v1/brightness` | Set app brightness, `(0, 1]`. |

### Enums

`PaymentMethod`, `SessionState`, `SessionType`, `TransactionTypeId`.

---

## Error handling

The Local Terminal API returns a **plain string body on 400** (not JSON). This
SDK throws an `ApiError` whose `message` is that raw text, and preserves the
exact body:

```ts
import { ApiError } from "@qrcommunication/viva-local-terminal-sdk";

try {
  await terminal.transactions.sale({ sessionId, amount: 0 });
} catch (err) {
  if (err instanceof ApiError) {
    console.error(err.httpStatus); // 400
    console.error(err.message); // "ZeroconfException error message Amount cannot be null"
    console.error(err.getErrorText()); // same raw text
    console.error(err.responseBody); // { raw: "ZeroconfException error message ..." }
  }
}
```

A failure to reach the terminal at all (wrong IP, terminal asleep, firewall)
throws an `ApiError` with `httpStatus === 0` and a message hinting at LAN
reachability.

| Class | Meaning |
| --- | --- |
| `VivaError` | Base class for every SDK error. |
| `ApiError` | HTTP error (4xx/5xx) or transport failure (`httpStatus === 0`). |

---

## Amounts & currency

- **All amounts are integers in the currency's minor unit (cents).**
  `1170` = 11.70 EUR.
- `currencyCode` is the **ISO 4217 numeric** code (`978` = EUR, `826` = GBP).

---

## License

MIT © QrCommunication
