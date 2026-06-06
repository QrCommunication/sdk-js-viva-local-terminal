import { describe, expect, it } from "vitest";
import { VivaLocalTerminalClient } from "../../src/client.js";
import { TransactionTypeId } from "../../src/enums.js";
import { mockFetch } from "../support/mock-fetch.js";

function client(mockedFetch: typeof fetch, useIsvEndpoints = false) {
  return new VivaLocalTerminalClient({
    terminalBaseUrl: "https://192.168.1.50:8080",
    fetch: mockedFetch,
    useIsvEndpoints,
  });
}

describe("Transactions", () => {
  it("sale() POSTs /pos/v1/sale with amount in cents and omits undefined", async () => {
    const mocked = mockFetch([
      { status: 200, body: { state: "PROCESSING", sessionId: "s1" } },
    ]);
    const res = await client(mocked.fetch).transactions.sale({
      sessionId: "s1",
      amount: 1170,
      currencyCode: 978,
      merchantReference: "order-123",
    });

    const req = mocked.last();
    expect(req.method).toBe("POST");
    expect(req.url).toBe("https://192.168.1.50:8080/pos/v1/sale");
    const body = req.body as Record<string, unknown>;
    expect(body.amount).toBe(1170);
    expect(body.currencyCode).toBe(978);
    expect(body.merchantReference).toBe("order-123");
    expect("customerTrns" in body).toBe(false);
    expect(res.state).toBe("PROCESSING");
  });

  it("sale() targets the ISV trailing-slash path when enabled", async () => {
    const mocked = mockFetch([{ status: 200, body: { state: "PROCESSING" } }]);
    await client(mocked.fetch, true).transactions.sale({
      sessionId: "s1",
      amount: 500,
      isvDetails: { sourceCode: "X" },
    });
    expect(mocked.last().url).toBe("https://192.168.1.50:8080/pos/v1/sale/");
  });

  it("capturePreauth() POSTs /pos/v1/preauth-completion", async () => {
    const mocked = mockFetch([{ status: 200, body: { state: "PROCESSING" } }]);
    await client(mocked.fetch).transactions.capturePreauth({
      sessionId: "s2",
      amount: 1000,
      transactionId: "txn-1",
    });
    const req = mocked.last();
    expect(req.url).toBe("https://192.168.1.50:8080/pos/v1/preauth-completion");
    expect((req.body as Record<string, unknown>).transactionId).toBe("txn-1");
  });

  it("refund() POSTs /pos/v1/refund with the transactionId", async () => {
    const mocked = mockFetch([{ status: 200, body: { state: "PROCESSING" } }]);
    await client(mocked.fetch).transactions.refund({
      sessionId: "s3",
      amount: 250,
      transactionId: "txn-2",
    });
    const req = mocked.last();
    expect(req.url).toBe("https://192.168.1.50:8080/pos/v1/refund");
    expect((req.body as Record<string, unknown>).transactionId).toBe("txn-2");
  });

  it("unreferencedRefund() POSTs /pos/v1/unreferenced-refund", async () => {
    const mocked = mockFetch([{ status: 200, body: { state: "PROCESSING" } }]);
    await client(mocked.fetch).transactions.unreferencedRefund({
      sessionId: "s4",
      amount: 999,
    });
    expect(mocked.last().url).toBe(
      "https://192.168.1.50:8080/pos/v1/unreferenced-refund",
    );
    expect((mocked.last().body as Record<string, unknown>).amount).toBe(999);
  });

  it("abort() POSTs /pos/v1/abort with the sessionId", async () => {
    const mocked = mockFetch([
      { status: 200, body: { state: "PROCESSING", sessionType: "ABORT" } },
    ]);
    await client(mocked.fetch).transactions.abort("s5");
    const req = mocked.last();
    expect(req.url).toBe("https://192.168.1.50:8080/pos/v1/abort");
    expect((req.body as Record<string, unknown>).sessionId).toBe("s5");
  });

  it("aadeFimControl() POSTs /pos/v1/aade-fim-control with the token", async () => {
    const mocked = mockFetch([
      { status: 200, body: { status: "success", message: "ok" } },
    ]);
    const res = await client(mocked.fetch).transactions.aadeFimControl(
      "ECR0210U/RCFB77000041",
    );
    const req = mocked.last();
    expect(req.url).toBe("https://192.168.1.50:8080/pos/v1/aade-fim-control");
    expect((req.body as Record<string, unknown>).token).toBe(
      "ECR0210U/RCFB77000041",
    );
    expect(res.status).toBe("success");
  });

  it("retrieve() GETs /pos/v1/transactions and joins transactionTypes arrays", async () => {
    const mocked = mockFetch([
      { status: 200, body: { isSuccess: true, transactions: [] } },
    ]);
    await client(mocked.fetch).transactions.retrieve({
      transactionTypes: [TransactionTypeId.SALE, TransactionTypeId.REFUND],
      isAadeAutonomouslyOnly: true,
      orderCode: "OC1",
    });
    const url = mocked.last().url;
    expect(mocked.last().method).toBe("GET");
    expect(url).toContain("/pos/v1/transactions?");
    expect(url).toContain("transactionTypes=5%2C4");
    expect(url).toContain("isAadeAutonomouslyOnly=true");
    expect(url).toContain("orderCode=OC1");
  });
});
