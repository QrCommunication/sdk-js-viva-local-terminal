import type { SessionState, SessionType } from "../enums.js";

/**
 * Immediate response returned by sale / capture / refund / abort operations.
 *
 * The terminal returns this synchronously with `state` typically `PROCESSING`.
 * Poll {@link SessionResponse} via `sessions.get(sessionId)` for the outcome.
 */
export interface TransactionResponse {
  /** Operation state, e.g. PROCESSING, BUSY_ERROR. */
  state?: SessionState | string;
  /** The kind of session created, e.g. SALE, CANCEL. */
  sessionType?: SessionType | string;
  /** The session id echoed back (the one you passed in). */
  sessionId?: string;
  [key: string]: unknown;
}

/**
 * Full session details returned by GET /pos/v1/sessions/{sessionId}.
 *
 * `payloadData` is populated only once the transaction has completed (state
 * SUCCESS or FAILURE).
 */
export interface SessionResponse {
  state?: SessionState | string;
  sessionType?: SessionType | string;
  sessionId?: string;
  /** Final transaction payload, present once the session has completed. */
  payloadData?: Record<string, unknown>;
  [key: string]: unknown;
}

/**
 * Response to AADE FIM control creation (Greek fiscalisation).
 *
 * @see /pos/v1/aade-fim-control
 */
export interface AadeFimControlResponse {
  status?: string;
  message?: string;
  [key: string]: unknown;
}

/**
 * Response to historical transaction retrieval.
 *
 * @see /pos/v1/transactions
 */
export interface TransactionsListResponse {
  isSuccess?: boolean;
  transactions?: Array<Record<string, unknown>>;
  [key: string]: unknown;
}

/**
 * Generic device-operation response (`screenControl`, `brightness`).
 *
 * @see /pos/v1/awake-lock, /pos/v1/brightness
 */
export interface DeviceResponse {
  isSuccess?: boolean;
  [key: string]: unknown;
}
