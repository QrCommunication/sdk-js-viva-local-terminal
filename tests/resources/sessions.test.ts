import { describe, expect, it } from "vitest";
import { VivaLocalTerminalClient } from "../../src/client.js";
import { mockFetch } from "../support/mock-fetch.js";

function client(mockedFetch: typeof fetch, useIsvEndpoints = false) {
  return new VivaLocalTerminalClient({
    terminalBaseUrl: "https://192.168.1.50:8080",
    fetch: mockedFetch,
    useIsvEndpoints,
  });
}

describe("Sessions", () => {
  it("get() GETs /pos/v1/sessions/{id} and URL-encodes the id", async () => {
    const mocked = mockFetch([
      {
        status: 200,
        body: { state: "SUCCESS", payloadData: { amount: 1170 } },
      },
    ]);
    const res = await client(mocked.fetch).sessions.get("4bdebe62 c211/ca0");
    const req = mocked.last();
    expect(req.method).toBe("GET");
    expect(req.url).toBe(
      "https://192.168.1.50:8080/pos/v1/sessions/4bdebe62%20c211%2Fca0",
    );
    expect(res.state).toBe("SUCCESS");
    expect(res.payloadData).toEqual({ amount: 1170 });
  });

  it("get() uses the ISV trailing-slash path when enabled", async () => {
    const mocked = mockFetch([{ status: 200, body: { state: "PROCESSING" } }]);
    await client(mocked.fetch, true).sessions.get("abc");
    expect(mocked.last().url).toBe(
      "https://192.168.1.50:8080/pos/v1/sessions/abc/",
    );
  });
});
