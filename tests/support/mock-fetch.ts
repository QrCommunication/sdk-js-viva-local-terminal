import { vi } from "vitest";

export interface MockedResponse {
  status: number;
  /** JSON body (object/array) — serialized with JSON.stringify. */
  body?: unknown;
  /**
   * Raw string body sent verbatim. Use this to simulate the Local Terminal's
   * plain-string 400 error responses. Takes precedence over `body`.
   */
  rawBody?: string;
  headers?: Record<string, string>;
}

export interface MockFetchHistory {
  url: string;
  method: string;
  body: unknown;
  headers: Record<string, string>;
  /** Whether an undici dispatcher was attached (used to assert TLS bypass). */
  hasDispatcher: boolean;
}

export interface MockedFetch {
  fetch: typeof fetch;
  history: MockFetchHistory[];
  last(): MockFetchHistory;
}

/**
 * Build a fake `fetch` that returns queued responses in order and records every
 * request. Supports both JSON and raw-string response bodies.
 */
export function mockFetch(responses: MockedResponse[]): MockedFetch {
  const history: MockFetchHistory[] = [];
  let index = 0;

  const impl = vi.fn(
    async (
      input: Parameters<typeof fetch>[0],
      init?:
        | (Parameters<typeof fetch>[1] & { dispatcher?: unknown })
        | undefined,
    ) => {
      const url =
        input instanceof URL
          ? input.toString()
          : typeof input === "string"
            ? input
            : (input as { url: string }).url;
      const method = (init?.method ?? "GET").toUpperCase();
      const headers: Record<string, string> = {};
      if (init?.headers) {
        if (init.headers instanceof Headers) {
          init.headers.forEach((value, key) => {
            headers[key] = value;
          });
        } else if (Array.isArray(init.headers)) {
          for (const pair of init.headers) {
            const key = pair[0];
            const value = pair[1];
            if (key !== undefined && value !== undefined) headers[key] = value;
          }
        } else {
          Object.assign(headers, init.headers);
        }
      }

      let body: unknown = null;
      if (typeof init?.body === "string" && init.body !== "") {
        try {
          body = JSON.parse(init.body);
        } catch {
          body = init.body;
        }
      }

      history.push({
        url,
        method,
        body,
        headers,
        hasDispatcher: init?.dispatcher !== undefined,
      });

      if (index >= responses.length) {
        throw new Error(
          `mockFetch: no more responses queued (call #${index + 1})`,
        );
      }
      const response = responses[index++]!;
      const payload =
        response.rawBody !== undefined
          ? response.rawBody
          : response.body === undefined
            ? ""
            : JSON.stringify(response.body);

      return new Response(payload, {
        status: response.status,
        headers: response.headers ?? { "Content-Type": "application/json" },
      });
    },
  ) as unknown as typeof fetch;

  return {
    fetch: impl,
    history,
    last(): MockFetchHistory {
      if (history.length === 0) {
        throw new Error("mockFetch: no requests recorded yet.");
      }
      return history[history.length - 1]!;
    },
  };
}

/** A fetch that always throws — simulates an unreachable terminal. */
export function throwingFetch(message = "ECONNREFUSED"): typeof fetch {
  return vi.fn(async () => {
    throw new Error(message);
  }) as unknown as typeof fetch;
}
