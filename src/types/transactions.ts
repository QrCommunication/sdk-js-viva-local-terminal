import type { PaymentMethod, TransactionTypeId } from "../enums.js";

/**
 * Parameters for {@link Transactions.sale} — POST /pos/v1/sale.
 *
 * Amounts are ALWAYS integers in the currency's minor unit (cents).
 */
export interface SaleParams {
  /** Caller-generated transaction session UUID. */
  sessionId: string;
  /** Amount to authorize, in cents. */
  amount: number;
  /** Free-text merchant reference. */
  merchantReference?: string;
  /** Free-text customer reference. */
  customerTrns?: string;
  /** Whether the payment is a pre-authorization. */
  preauth?: boolean;
  /** Tip amount in cents (not compatible with `preauth`). */
  tipAmount?: number;
  /** Default payment method shown first (e.g. "CardPresent"). */
  paymentMethod?: PaymentMethod | string;
  /** Whether to show the transaction result on screen. */
  showTransactionResult?: boolean;
  /** Whether to show the receipt and result on screen. */
  showReceipt?: boolean;
  /** ISO 4217 numeric currency code (merchant currency), e.g. 978 for EUR. */
  currencyCode?: number;
  /** Disable surcharge even on eligible cards. */
  skipSurcharge?: boolean;
  /** Base64-encoded JSON of extra acquirer metadata. */
  saleToAcquirerData?: string;
  /** Max instalments allowed (Greek merchants only). */
  maxInstalments?: number;
  /** AADE provider id (Greece). */
  aadeProviderId?: string;
  /** AADE provider signature data (Greece). */
  aadeProviderSignatureData?: string;
  /** AADE provider signature (Greece). */
  aadeProviderSignature?: string;
  /** AADE preloaded flag (Greece). */
  aadePreloaded?: boolean;
  /** AADE preloaded expiry duration (Greece). */
  aadePreloadedDuration?: number;
  /** Viva Fiscalisation object. */
  fiscalisationData?: Record<string, unknown>;
  /** ISV partner / fee / multi-merchant object (ISV endpoints only). */
  isvDetails?: Record<string, unknown>;
}

/**
 * Parameters for {@link Transactions.capturePreauth} —
 * POST /pos/v1/preauth-completion.
 */
export interface CapturePreauthParams {
  /** Caller-generated transaction session UUID. */
  sessionId: string;
  /** Amount to capture, in cents. */
  amount: number;
  /** Transaction id of the original pre-authorized sale. */
  transactionId: string;
  merchantReference?: string;
  customerTrns?: string;
  /** ISO 4217 numeric currency code. */
  currencyCode?: number;
  saleToAcquirerData?: string;
  aadeProviderId?: string;
  aadeProviderSignatureData?: string;
  aadeProviderSignature?: string;
  aadePreloaded?: boolean;
  aadePreloadedDuration?: number;
}

/**
 * Parameters for {@link Transactions.refund} — POST /pos/v1/refund.
 *
 * A referenced refund / cancellation linked to an original transaction.
 */
export interface RefundParams {
  /** Caller-generated transaction session UUID. */
  sessionId: string;
  /** Amount to refund, in cents. */
  amount: number;
  /** Transaction id of the original sale to refund. */
  transactionId: string;
  /** Order code of the original sale. */
  orderCode?: number;
  /** Short order code (filter helper). */
  shortOrderCode?: number;
  merchantReference?: string;
  customerTrns?: string;
  currencyCode?: number;
  showTransactionResult?: boolean;
  showReceipt?: boolean;
  /** ISO 8601 lower bound for locating the transaction. */
  txnDateFrom?: string;
  /** ISO 8601 upper bound for locating the transaction. */
  txnDateTo?: string;
  aadeProviderId?: string;
  aadeProviderSignatureData?: string;
  aadeProviderSignature?: string;
}

/**
 * Parameters for {@link Transactions.unreferencedRefund} —
 * POST /pos/v1/unreferenced-refund.
 */
export interface UnreferencedRefundParams {
  /** Caller-generated transaction session UUID. */
  sessionId: string;
  /** Amount to refund, in cents. */
  amount: number;
  merchantReference?: string;
  customerTrns?: string;
  showTransactionResult?: boolean;
  showReceipt?: boolean;
  aadeProviderId?: string;
  aadeProviderSignatureData?: string;
  aadeProviderSignature?: string;
  fiscalisationData?: Record<string, unknown>;
}

/**
 * Filters for {@link Transactions.retrieve} — GET /pos/v1/transactions.
 *
 * All filters are optional. `transactionTypes` may be a single id or a list.
 */
export interface RetrieveTransactionsParams {
  cardNumber?: string;
  orderCode?: string;
  transactionTypes?:
    | TransactionTypeId
    | number
    | Array<TransactionTypeId | number>;
  transactionStatus?: string;
  /** ISO 8601 lower bound. */
  startDate?: string;
  /** ISO 8601 upper bound. */
  endDate?: string;
  isAadeAutonomouslyOnly?: boolean;
}
