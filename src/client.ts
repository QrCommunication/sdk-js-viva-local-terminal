import {
  VivaLocalTerminalConfig,
  type VivaLocalTerminalConfigOptions,
} from "./config.js";
import { HttpClient } from "./http.js";
import { Device } from "./resources/device.js";
import { Sessions } from "./resources/sessions.js";
import { Transactions } from "./resources/transactions.js";

export type VivaLocalTerminalClientOptions = VivaLocalTerminalConfigOptions;

/**
 * Viva.com Local Terminal SDK — main entry point.
 *
 * The Local Terminal API is a PEER-TO-PEER (P2P) protocol: this client talks
 * DIRECTLY to an EFT POS terminal over the local network. There is no Viva cloud
 * endpoint and no authentication — you address the terminal's own IP and port.
 *
 * @example
 * ```ts
 * import { VivaLocalTerminalClient } from "@qrcommunication/viva-local-terminal-sdk";
 * import { randomUUID } from "node:crypto";
 *
 * const terminal = new VivaLocalTerminalClient({
 *   terminalBaseUrl: "https://192.168.1.50:8080",
 *   // self-signed terminal cert on a closed LAN:
 *   verifyTls: false,
 * });
 *
 * // Start a sale (amount in cents)
 * const sessionId = randomUUID();
 * const res = await terminal.transactions.sale({
 *   sessionId,
 *   amount: 1170,        // 11.70 EUR
 *   currencyCode: 978,   // EUR
 *   merchantReference: "order-123",
 * });
 * // res.state === "PROCESSING"
 *
 * // Poll for the result
 * const session = await terminal.sessions.get(sessionId);
 * // session.state === "SUCCESS" once the cardholder has paid
 *
 * // Control the device
 * await terminal.device.screenControl(true);
 * await terminal.device.brightness(0.5);
 * ```
 */
export class VivaLocalTerminalClient {
  readonly transactions: Transactions;
  readonly sessions: Sessions;
  readonly device: Device;

  private readonly config: VivaLocalTerminalConfig;
  private readonly http: HttpClient;

  constructor(options: VivaLocalTerminalClientOptions) {
    this.config = new VivaLocalTerminalConfig(options);
    this.http = new HttpClient(this.config);

    this.transactions = new Transactions(this.http);
    this.sessions = new Sessions(this.http);
    this.device = new Device(this.http);
  }

  /** The resolved, immutable configuration in use by this client. */
  getConfig(): VivaLocalTerminalConfig {
    return this.config;
  }
}
