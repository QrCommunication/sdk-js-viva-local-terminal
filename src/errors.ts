/**
 * Error model for the Viva.com Local Terminal (P2P) API.
 *
 * The Local Terminal API does NOT return structured error codes. On a 400 it
 * returns a PLAIN STRING body (e.g. "ZeroconfException error message Amount
 * cannot be null"). The raw body is always preserved so callers can inspect the
 * exact text the terminal sent back.
 */

/**
 * Shape used to carry whatever the terminal returned on an error. When the body
 * was JSON it is spread here; when it was a plain string it is preserved under
 * `raw`.
 */
export interface VivaErrorBody {
  message?: string;
  error?: string;
  /** The raw, undecoded response body (set when the terminal returns a string). */
  raw?: string;
  [key: string]: unknown;
}

/**
 * Base error for every Viva Local Terminal SDK failure.
 */
export class VivaError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "VivaError";
    if (
      typeof (Error as { captureStackTrace?: unknown }).captureStackTrace ===
      "function"
    ) {
      (
        Error as { captureStackTrace: (target: object, ctor: unknown) => void }
      ).captureStackTrace(this, this.constructor);
    }
  }
}

/**
 * Thrown when the terminal returns an HTTP error (4xx/5xx) or when the request
 * could not reach the terminal at all (httpStatus === 0).
 *
 * The Local Terminal API returns a plain string body on 400, so the human
 * message is that raw string verbatim. Use {@link getErrorText} to retrieve it.
 */
export class ApiError extends VivaError {
  public readonly httpStatus: number;
  public readonly responseBody: VivaErrorBody | null;

  constructor(
    message: string,
    httpStatus: number,
    responseBody: VivaErrorBody | null = null,
  ) {
    super(message);
    this.name = "ApiError";
    this.httpStatus = httpStatus;
    this.responseBody = responseBody;
  }

  /**
   * The error text reported by the terminal, preferring a structured field and
   * falling back to the raw string body. Returns `null` if nothing was sent.
   */
  getErrorText(): string | null {
    return (
      this.responseBody?.message ??
      this.responseBody?.error ??
      this.responseBody?.raw ??
      null
    );
  }
}
