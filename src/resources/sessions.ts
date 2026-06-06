import type { HttpClient } from "../http.js";
import type { SessionResponse } from "../types/common.js";

/**
 * Session retrieval on the Local Terminal (P2P) API.
 *
 * After a sale/refund/preauth-completion returns `PROCESSING`, poll the session
 * to obtain the final outcome. The `payloadData` field is populated only once
 * the transaction has completed (with `state` SUCCESS or FAILURE).
 *
 * The ISV variant uses a trailing slash (`/pos/v1/sessions/{id}/`), handled
 * automatically when `useIsvEndpoints` is enabled.
 *
 * @see /pos/v1/sessions/{sessionId}
 */
export class Sessions {
  constructor(private readonly http: HttpClient) {}

  /**
   * Retrieve a session's full details by its id —
   * GET /pos/v1/sessions/{sessionId}.
   */
  get(sessionId: string): Promise<SessionResponse> {
    return this.http.get<SessionResponse>(
      `/pos/v1/sessions/${encodeURIComponent(sessionId)}`,
    );
  }
}
