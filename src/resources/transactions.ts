import type { HttpClient } from "../http.js";
import type {
  AadeFimControlResponse,
  TransactionResponse,
  TransactionsListResponse,
} from "../types/common.js";
import type {
  CapturePreauthParams,
  RefundParams,
  RetrieveTransactionsParams,
  SaleParams,
  UnreferencedRefundParams,
} from "../types/transactions.js";

/** Drop keys whose value is `undefined` so they aren't serialized. */
function compact<T extends Record<string, unknown>>(obj: T): Partial<T> {
  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(obj)) {
    if (value !== undefined) out[key] = value;
  }
  return out as Partial<T>;
}

/**
 * Transaction operations on the Local Terminal (P2P) API.
 *
 * Every operation that starts a transaction returns IMMEDIATELY with a `state`
 * (typically `PROCESSING`) and a `sessionId`. The actual outcome is then polled
 * via `sessions.get()` once the cardholder has interacted with the terminal.
 *
 * Amounts are ALWAYS integers in the currency's minor unit (cents).
 *
 * Merchant vs ISV variants: the same methods serve both. Whether a request hits
 * the ISV trailing-slash path (e.g. `/pos/v1/sale/`) is controlled globally by
 * `useIsvEndpoints`. ISV sale/refund additionally accept `isvDetails`.
 *
 * @see /pos/v1/sale, /pos/v1/preauth-completion, /pos/v1/refund,
 *      /pos/v1/unreferenced-refund, /pos/v1/abort, /pos/v1/aade-fim-control,
 *      /pos/v1/transactions
 */
export class Transactions {
  constructor(private readonly http: HttpClient) {}

  /**
   * Initiate a sale request — POST /pos/v1/sale.
   *
   * The terminal displays the amount and waits for the card. Use
   * `sessions.get()` with the returned `sessionId` to retrieve the final result.
   */
  sale(params: SaleParams): Promise<TransactionResponse> {
    return this.http.post<TransactionResponse>(
      "/pos/v1/sale",
      compact({ ...params }),
    );
  }

  /**
   * Capture (complete) a previously pre-authorized sale —
   * POST /pos/v1/preauth-completion.
   */
  capturePreauth(params: CapturePreauthParams): Promise<TransactionResponse> {
    return this.http.post<TransactionResponse>(
      "/pos/v1/preauth-completion",
      compact({ ...params }),
    );
  }

  /**
   * Refund / cancel a transaction by its original transaction id —
   * POST /pos/v1/refund.
   */
  refund(params: RefundParams): Promise<TransactionResponse> {
    return this.http.post<TransactionResponse>(
      "/pos/v1/refund",
      compact({ ...params }),
    );
  }

  /**
   * Issue an unreferenced refund (not linked to an original transaction) —
   * POST /pos/v1/unreferenced-refund.
   */
  unreferencedRefund(
    params: UnreferencedRefundParams,
  ): Promise<TransactionResponse> {
    return this.http.post<TransactionResponse>(
      "/pos/v1/unreferenced-refund",
      compact({ ...params }),
    );
  }

  /**
   * Abort an in-progress SALE session — POST /pos/v1/abort.
   */
  abort(sessionId: string): Promise<TransactionResponse> {
    return this.http.post<TransactionResponse>("/pos/v1/abort", { sessionId });
  }

  /**
   * Create an AADE FIM control action — POST /pos/v1/aade-fim-control.
   *
   * Creates the Echo Message (to fetch the Master Key) and the Control Message
   * (to create the Session Key), validating the Master Key, KCV and encrypted
   * Session Key (Greek AADE fiscalisation).
   *
   * @param token The FIMAS control token including the AADE token.
   */
  aadeFimControl(token: string): Promise<AadeFimControlResponse> {
    return this.http.post<AadeFimControlResponse>("/pos/v1/aade-fim-control", {
      token,
    });
  }

  /**
   * Retrieve historical transactions with optional filters —
   * GET /pos/v1/transactions.
   *
   * `transactionTypes` may be a single id or a list. When an array is passed it
   * is sent as a comma-separated value.
   */
  retrieve(
    params: RetrieveTransactionsParams = {},
  ): Promise<TransactionsListResponse> {
    const {
      transactionTypes,
      isAadeAutonomouslyOnly,
      cardNumber,
      orderCode,
      transactionStatus,
      startDate,
      endDate,
    } = params;

    const query = compact({
      cardNumber,
      orderCode,
      transactionTypes: Array.isArray(transactionTypes)
        ? transactionTypes.join(",")
        : transactionTypes,
      transactionStatus,
      startDate,
      endDate,
      isAadeAutonomouslyOnly:
        isAadeAutonomouslyOnly === undefined
          ? undefined
          : isAadeAutonomouslyOnly
            ? "true"
            : "false",
    });

    return this.http.get<TransactionsListResponse>("/pos/v1/transactions", {
      query,
    });
  }
}
