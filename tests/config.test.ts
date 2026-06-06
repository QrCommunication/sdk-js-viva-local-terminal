import { describe, expect, it } from "vitest";
import { VivaLocalTerminalConfig } from "../src/config.js";

describe("VivaLocalTerminalConfig", () => {
  it("rejects an empty terminalBaseUrl", () => {
    expect(
      () => new VivaLocalTerminalConfig({ terminalBaseUrl: "   " }),
    ).toThrow(/terminalBaseUrl cannot be empty/);
  });

  it("rejects a base URL without a scheme", () => {
    expect(
      () =>
        new VivaLocalTerminalConfig({ terminalBaseUrl: "192.168.1.50:8080" }),
    ).toThrow(/must include the scheme/);
  });

  it("strips a trailing slash from the base URL", () => {
    const config = new VivaLocalTerminalConfig({
      terminalBaseUrl: "https://192.168.1.50:8080///",
    });
    expect(config.baseUrl).toBe("https://192.168.1.50:8080");
  });

  it("defaults verifyTls to true and useIsvEndpoints to false", () => {
    const config = new VivaLocalTerminalConfig({
      terminalBaseUrl: "https://192.168.1.50:8080",
    });
    expect(config.verifyTls).toBe(true);
    expect(config.useIsvEndpoints).toBe(false);
    expect(config.timeout).toBe(30_000);
  });

  it("builds merchant URLs without a trailing slash", () => {
    const config = new VivaLocalTerminalConfig({
      terminalBaseUrl: "https://192.168.1.50:8080",
    });
    expect(config.url("/pos/v1/sale")).toBe(
      "https://192.168.1.50:8080/pos/v1/sale",
    );
  });

  it("appends a trailing slash for ISV endpoints", () => {
    const config = new VivaLocalTerminalConfig({
      terminalBaseUrl: "https://192.168.1.50:8080",
      useIsvEndpoints: true,
    });
    expect(config.url("/pos/v1/sale")).toBe(
      "https://192.168.1.50:8080/pos/v1/sale/",
    );
  });
});
