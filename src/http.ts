import { Agent, type Dispatcher } from "undici";
import type { VivaLocalTerminalConfig } from "./config.js";
import { ApiError, type VivaErrorBody } from "./errors.js";

export interface HttpRequestOptions {
  query?: Record<string, string | number | boolean | undefined | null>;
  body?: unknown;
  signal?: AbortSignal;
}

/**
 * Low-level HTTP client for the Local Terminal (P2P) API.
 *
 * Transport model:
 *   - Requests go DIRECTLY to the terminal on the LAN (base URL = terminal
 *     IP:port). There is NO cloud endpoint.
 *   - NO authentication: no Authorization header, no token exchange. The
 *     terminal trusts any caller on the closed network (per the official spec).
 *   - HTTPS is served by the terminal, often with a self-signed certificate. On
 *     Node, when `verifyTls` is `false`, an undici `Agent` with
 *     `connect.rejectUnauthorized = false` is used so the self-signed cert is
 *     accepted (the standard `fetch` API has no per-call TLS toggle).
 *
 * Error model:
 *   The API returns JSON on 2xx but a PLAIN STRING body on 400 (e.g.
 *   "ZeroconfException error message Amount cannot be null"). This client
 *   decodes JSON when possible and preserves the raw string under `raw`
 *   otherwise. The thrown {@link ApiError}'s message is that raw text.
 */
export class HttpClient {
  private readonly dispatcher: Dispatcher | undefined;

  constructor(private readonly config: VivaLocalTerminalConfig) {
    if (config.dispatcher) {
      this.dispatcher = config.dispatcher;
    } else if (config.verifyTls === false) {
      // No user-supplied dispatcher and TLS verification disabled: build an
      // undici Agent that accepts the terminal's self-signed certificate.
      this.dispatcher = new Agent({ connect: { rejectUnauthorized: false } });
    } else {
      this.dispatcher = undefined;
    }
  }

  get<T = unknown>(
    path: string,
    options: Omit<HttpRequestOptions, "body"> = {},
  ): Promise<T> {
    return this.request<T>("GET", path, options);
  }

  post<T = unknown>(
    path: string,
    body: unknown = {},
    options: Omit<HttpRequestOptions, "body"> = {},
  ): Promise<T> {
    return this.request<T>("POST", path, { ...options, body });
  }

  private async request<T>(
    method: string,
    path: string,
    options: HttpRequestOptions,
  ): Promise<T> {
    const url = this.buildUrl(path, options.query);

    const timeoutController = new AbortController();
    const timeoutId = setTimeout(
      () => timeoutController.abort(),
      this.config.timeout,
    );
    const signal = this.mergeSignals(options.signal, timeoutController.signal);

    // undici reads `dispatcher` off the RequestInit; the global fetch supports
    // it on Node. We cast because the DOM lib's RequestInit doesn't type it.
    const init: RequestInit & { dispatcher?: Dispatcher } = {
      method,
      headers: {
        // No Authorization header — the P2P protocol is unauthenticated.
        Accept: "application/json",
        ...(options.body !== undefined
          ? { "Content-Type": "application/json" }
          : {}),
      },
      body:
        options.body !== undefined ? JSON.stringify(options.body) : undefined,
      signal,
    };
    if (this.dispatcher) {
      init.dispatcher = this.dispatcher;
    }

    let response: Response;
    try {
      response = await this.config.fetch(url, init);
    } catch (err) {
      clearTimeout(timeoutId);
      const reason = err instanceof Error ? err.message : String(err);
      throw new ApiError(
        `Local Terminal request failed (is the terminal reachable on the LAN?): ${reason}`,
        0,
        null,
      );
    } finally {
      clearTimeout(timeoutId);
    }

    const rawBody = await response.text();
    const decoded = this.decodeBody(rawBody);

    if (!response.ok) {
      throw this.buildException(response.status, rawBody, decoded);
    }

    return decoded as T;
  }

  private buildUrl(path: string, query: HttpRequestOptions["query"]): string {
    const joined = this.config.url(path);
    if (!query) return joined;

    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(query)) {
      if (value === undefined || value === null) continue;
      params.set(key, String(value));
    }
    const qs = params.toString();
    return qs ? `${joined}?${qs}` : joined;
  }

  private decodeBody(rawBody: string): unknown {
    if (rawBody === "") return {};
    try {
      return JSON.parse(rawBody);
    } catch {
      // The Local Terminal API returns a plain string body on 400.
      return { raw: rawBody };
    }
  }

  private buildException(
    statusCode: number,
    rawBody: string,
    decoded: unknown,
  ): ApiError {
    const isObject =
      decoded !== null &&
      typeof decoded === "object" &&
      !Array.isArray(decoded);
    const body = isObject ? (decoded as VivaErrorBody) : null;

    // Prefer a structured field; otherwise use the raw string verbatim.
    const message =
      (body &&
        (typeof body.message === "string"
          ? body.message
          : typeof body.error === "string"
            ? body.error
            : typeof body.raw === "string"
              ? body.raw
              : undefined)) ??
      (rawBody !== "" ? rawBody : `HTTP ${statusCode}`);

    return new ApiError(message, statusCode, body ?? { raw: rawBody });
  }

  private mergeSignals(
    external: AbortSignal | undefined,
    internal: AbortSignal,
  ): AbortSignal {
    if (!external) return internal;
    const anyFn = (
      AbortSignal as { any?: (signals: AbortSignal[]) => AbortSignal }
    ).any;
    if (typeof anyFn === "function") {
      return anyFn([external, internal]);
    }
    if (external.aborted) {
      const controller = new AbortController();
      controller.abort(external.reason);
      return controller.signal;
    }
    const controller = new AbortController();
    external.addEventListener(
      "abort",
      () => controller.abort(external.reason),
      {
        once: true,
      },
    );
    internal.addEventListener(
      "abort",
      () => controller.abort(internal.reason),
      {
        once: true,
      },
    );
    return controller.signal;
  }
}
