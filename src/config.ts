/**
 * Configuration for the Viva.com Local Terminal API.
 *
 * Unlike the Viva cloud APIs (api.vivapayments.com, OAuth2), the Local Terminal
 * API is a PEER-TO-PEER (P2P) protocol: the client talks DIRECTLY to the EFT POS
 * terminal over the local network. There is therefore:
 *
 *   - NO cloud "environment" (demo/production) — the base URL is the terminal's
 *     own IP address and port, e.g. `https://192.168.1.50:8080`.
 *   - NO authentication. The official spec states verbatim:
 *       "In a closed network environment, authentication is not required for
 *        peer-to-peer communication. [...] eliminating the need to include an
 *        Authorization tag in the header."
 *
 * The terminal serves HTTPS, usually with a self-signed certificate. By default
 * this SDK VERIFIES TLS. On a closed LAN with a self-signed terminal cert you
 * typically pass `verifyTls: false` (accepting the LAN-only trust model).
 */

import type { Dispatcher } from "undici";

export interface VivaLocalTerminalConfigOptions {
  /**
   * The terminal's base URL: scheme + IP + port, e.g.
   * `https://192.168.1.50:8080`. A trailing slash, if present, is stripped.
   */
  terminalBaseUrl: string;

  /**
   * TLS certificate verification.
   *
   * `true` (default) verifies the terminal's certificate against the system CA
   * bundle. `false` disables verification, which is the common case for a
   * self-signed terminal certificate on a trusted closed LAN.
   */
  verifyTls?: boolean;

  /**
   * Target the ISV (trailing-slash) endpoint variants, e.g. `/pos/v1/sale/`.
   * The merchant (default) variants use no trailing slash.
   */
  useIsvEndpoints?: boolean;

  /**
   * Per-request timeout in milliseconds. Terminal interactions are async (they
   * return PROCESSING immediately), so a short timeout is fine for the
   * initiating call. Defaults to 30000 (30s).
   */
  timeout?: number;

  /**
   * Optional `fetch` implementation override (mainly for testing). Defaults to
   * the platform global `fetch` (Node 18+, browsers, Deno).
   */
  fetch?: typeof fetch;

  /**
   * Optional undici `Dispatcher` override. When omitted and `verifyTls` is
   * `false` on Node, an undici `Agent` with `connect.rejectUnauthorized = false`
   * is created automatically so the self-signed terminal cert is accepted.
   */
  dispatcher?: Dispatcher;
}

/**
 * Immutable runtime configuration for the Local Terminal client.
 */
export class VivaLocalTerminalConfig {
  /** The normalized terminal base URL (no trailing slash). */
  readonly baseUrl: string;
  readonly verifyTls: boolean;
  readonly useIsvEndpoints: boolean;
  readonly timeout: number;
  readonly fetch: typeof fetch;
  readonly dispatcher: Dispatcher | undefined;

  constructor(options: VivaLocalTerminalConfigOptions) {
    const trimmed = (options.terminalBaseUrl ?? "").trim().replace(/\/+$/, "");

    if (trimmed === "") {
      throw new Error(
        "VivaLocalTerminalConfig: terminalBaseUrl cannot be empty.",
      );
    }

    if (!/^https?:\/\//i.test(trimmed)) {
      throw new Error(
        'VivaLocalTerminalConfig: terminalBaseUrl must include the scheme, e.g. "https://192.168.1.50:8080".',
      );
    }

    this.baseUrl = trimmed;
    this.verifyTls = options.verifyTls ?? true;
    this.useIsvEndpoints = options.useIsvEndpoints ?? false;
    this.timeout = options.timeout ?? 30_000;
    this.fetch = options.fetch ?? globalThis.fetch;
    this.dispatcher = options.dispatcher;

    if (typeof this.fetch !== "function") {
      throw new Error(
        "VivaLocalTerminalConfig: no fetch implementation available. Provide one via `fetch` option or run on a platform with a global fetch (Node 18+, browsers, Deno).",
      );
    }
  }

  /**
   * Build the absolute URL for a `/pos/v1/...` endpoint.
   *
   * The ISV variants of the endpoints differ only by a trailing slash. When
   * {@link useIsvEndpoints} is true, a trailing slash is appended to the path
   * (unless one is already present), matching the spec's `(ISV)` paths.
   */
  url(path: string): string {
    let normalized = `/${path.replace(/^\/+/, "")}`;

    if (this.useIsvEndpoints && !normalized.endsWith("/")) {
      normalized += "/";
    }

    return this.baseUrl + normalized;
  }
}
