import { describe, expect, it } from "vitest";
import { VivaLocalTerminalConfig } from "../src/config.js";
import { HttpClient } from "../src/http.js";
import { ApiError } from "../src/errors.js";
import { mockFetch, throwingFetch } from "./support/mock-fetch.js";

function clientWith(
  mockedFetch: typeof fetch,
  opts: Partial<{ verifyTls: boolean; useIsvEndpoints: boolean }> = {},
): HttpClient {
  return new HttpClient(
    new VivaLocalTerminalConfig({
      terminalBaseUrl: "https://192.168.1.50:8080",
      fetch: mockedFetch,
      ...opts,
    }),
  );
}

describe("HttpClient", () => {
  it("sends NO Authorization header (P2P is unauthenticated)", async () => {
    const mocked = mockFetch([{ status: 200, body: { isSuccess: true } }]);
    await clientWith(mocked.fetch).post("/pos/v1/awake-lock", {
      wakeUpLock: true,
    });

    const headers = mocked.last().headers;
    const hasAuth = Object.keys(headers).some(
      (k) => k.toLowerCase() === "authorization",
    );
    expect(hasAuth).toBe(false);
  });

  it("parses a PLAIN STRING 400 body and preserves it verbatim", async () => {
    const raw = "ZeroconfException error message Amount cannot be null";
    const mocked = mockFetch([{ status: 400, rawBody: raw }]);

    await expect(
      clientWith(mocked.fetch).post("/pos/v1/sale", { sessionId: "x" }),
    ).rejects.toMatchObject({
      message: raw,
      httpStatus: 400,
    });

    try {
      await clientWith(mockFetch([{ status: 400, rawBody: raw }]).fetch).post(
        "/pos/v1/sale",
        {},
      );
    } catch (err) {
      expect(err).toBeInstanceOf(ApiError);
      expect((err as ApiError).getErrorText()).toBe(raw);
      expect((err as ApiError).responseBody).toEqual({ raw });
    }
  });

  it("wraps an unreachable terminal in an ApiError with status 0", async () => {
    const client = clientWith(throwingFetch("ECONNREFUSED"));
    await expect(client.get("/pos/v1/sessions/abc")).rejects.toMatchObject({
      httpStatus: 0,
    });
    await expect(client.get("/pos/v1/sessions/abc")).rejects.toThrow(
      /reachable on the LAN/,
    );
  });

  it("returns an empty object on an empty 2xx body", async () => {
    const mocked = mockFetch([{ status: 200, rawBody: "" }]);
    const result = await clientWith(mocked.fetch).post("/pos/v1/abort", {
      sessionId: "x",
    });
    expect(result).toEqual({});
  });

  it("attaches an undici dispatcher when verifyTls is false", async () => {
    const mocked = mockFetch([{ status: 200, body: { isSuccess: true } }]);
    await clientWith(mocked.fetch, { verifyTls: false }).post(
      "/pos/v1/brightness",
      { brightness: 0.5 },
    );
    expect(mocked.last().hasDispatcher).toBe(true);
  });

  it("does NOT attach a dispatcher when verifyTls is true", async () => {
    const mocked = mockFetch([{ status: 200, body: { isSuccess: true } }]);
    await clientWith(mocked.fetch, { verifyTls: true }).post(
      "/pos/v1/brightness",
      { brightness: 0.5 },
    );
    expect(mocked.last().hasDispatcher).toBe(false);
  });
});
