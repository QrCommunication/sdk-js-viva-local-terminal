import { describe, expect, it } from "vitest";
import { VivaLocalTerminalClient } from "../../src/client.js";
import { mockFetch } from "../support/mock-fetch.js";

function client(mockedFetch: typeof fetch) {
  return new VivaLocalTerminalClient({
    terminalBaseUrl: "https://192.168.1.50:8080",
    fetch: mockedFetch,
  });
}

describe("Device", () => {
  it("screenControl() POSTs /pos/v1/awake-lock with wakeUpLock", async () => {
    const mocked = mockFetch([{ status: 200, body: { isSuccess: true } }]);
    const res = await client(mocked.fetch).device.screenControl(true);
    const req = mocked.last();
    expect(req.url).toBe("https://192.168.1.50:8080/pos/v1/awake-lock");
    expect((req.body as Record<string, unknown>).wakeUpLock).toBe(true);
    expect(res.isSuccess).toBe(true);
  });

  it("brightness() POSTs /pos/v1/brightness with the value", async () => {
    const mocked = mockFetch([{ status: 200, body: { isSuccess: true } }]);
    await client(mocked.fetch).device.brightness(0.5);
    const req = mocked.last();
    expect(req.url).toBe("https://192.168.1.50:8080/pos/v1/brightness");
    expect((req.body as Record<string, unknown>).brightness).toBe(0.5);
  });

  it("brightness() rejects 0 and values above 1 without calling fetch", async () => {
    const mocked = mockFetch([]);
    const c = client(mocked.fetch);
    expect(() => c.device.brightness(0)).toThrow(/greater than 0/);
    expect(() => c.device.brightness(1.5)).toThrow(/at most 1/);
    expect(mocked.history.length).toBe(0);
  });
});
