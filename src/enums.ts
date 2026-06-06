/**
 * Enumerations for the Viva.com Local Terminal API.
 *
 * These mirror the string/numeric values the terminal returns and accepts.
 */

/**
 * The `paymentMethod` accepted by the sale request — the payment method
 * displayed to the user first by default. The user may still choose an
 * alternative method on the terminal.
 *
 * @see /pos/v1/sale
 */
export enum PaymentMethod {
  CARD_PRESENT = "CardPresent",
  IRIS = "Iris",
}

/**
 * The `state` value returned by the Local Terminal API.
 *
 * Returned immediately by sale/refund/abort/etc. (PROCESSING, BUSY_ERROR, ...)
 * and as the terminal/session outcome by GET /pos/v1/sessions/{sessionId}
 * (SUCCESS, FAILURE).
 *
 * @see /pos/v1/sale, /pos/v1/sessions/{sessionId}
 */
export enum SessionState {
  /** The operation is in progress on the terminal. */
  PROCESSING = "PROCESSING",
  /** Another transaction is already in progress on the terminal. */
  BUSY_ERROR = "BUSY_ERROR",
  /** The terminal reported a server-side error. */
  SERVER_ERROR = "SERVER_ERROR",
  /** The given session id could not be found (abort). */
  SESSION_NOT_FOUND_ERROR = "SESSION_NOT_FOUND_ERROR",
  /** The transaction completed successfully (sessions outcome). */
  SUCCESS = "SUCCESS",
  /** The transaction completed with an error (sessions outcome). */
  FAILURE = "FAILURE",
}

/**
 * The `sessionType` returned by the Local Terminal API, indicating which kind
 * of operation a session represents.
 *
 * @see /pos/v1/sale, /pos/v1/refund, /pos/v1/abort, /pos/v1/sessions/{sessionId}
 */
export enum SessionType {
  /** A sale transaction. */
  SALE = "SALE",
  /** A capture (completion) of a pre-authorized sale. */
  CAPTURE_PREAUTH = "CAPTURE_PREAUTH",
  /** A refund / cancellation referencing an original transaction. */
  CANCEL = "CANCEL",
  /** An unreferenced refund (not linked to an original transaction). */
  UNREFERENCED_REFUND = "UNREFERENCED_REFUND",
  /** An abort of an in-progress SALE session. */
  ABORT = "ABORT",
}

/**
 * Transaction type identifiers returned in transaction / session payloads
 * (`transactionTypeId`) and accepted as the `transactionTypes` query filter on
 * GET /pos/v1/transactions.
 *
 * @see /pos/v1/transactions, /pos/v1/sessions/{sessionId}
 */
export enum TransactionTypeId {
  SALE = 5,
  REFUND = 4,
  REVERSAL = 7,
  IRIS_SALE = 60,
  IRIS_REFUND = 61,
  IRIS_VOID = 85,
}
