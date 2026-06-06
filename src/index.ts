// Core
export {
  VivaLocalTerminalClient,
  type VivaLocalTerminalClientOptions,
} from "./client.js";
export {
  VivaLocalTerminalConfig,
  type VivaLocalTerminalConfigOptions,
} from "./config.js";
export { HttpClient, type HttpRequestOptions } from "./http.js";

// Resources
export { Transactions } from "./resources/transactions.js";
export { Sessions } from "./resources/sessions.js";
export { Device } from "./resources/device.js";

// Enums
export {
  PaymentMethod,
  SessionState,
  SessionType,
  TransactionTypeId,
} from "./enums.js";

// Errors
export { VivaError, ApiError, type VivaErrorBody } from "./errors.js";

// Types
export type * from "./types/index.js";
