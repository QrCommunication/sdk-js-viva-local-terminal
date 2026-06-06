import { describe, expect, it } from "vitest";
import { VivaLocalTerminalClient } from "../src/client.js";

describe("VivaLocalTerminalClient", () => {
  it("exposes transactions, sessions and device resources", () => {
    const client = new VivaLocalTerminalClient({
      terminalBaseUrl: "https://192.168.1.50:8080",
    });
    expect(client.transactions).toBeDefined();
    expect(client.sessions).toBeDefined();
    expect(client.device).toBeDefined();
  });

  it("validates the terminalBaseUrl at construction time", () => {
    expect(() => new VivaLocalTerminalClient({ terminalBaseUrl: "" })).toThrow(
      /terminalBaseUrl/,
    );
  });

  it("exposes the resolved config via getConfig()", () => {
    const client = new VivaLocalTerminalClient({
      terminalBaseUrl: "https://192.168.1.50:8080/",
      verifyTls: false,
    });
    expect(client.getConfig().baseUrl).toBe("https://192.168.1.50:8080");
    expect(client.getConfig().verifyTls).toBe(false);
  });
});
