import type { HttpClient } from "../http.js";
import type { DeviceResponse } from "../types/common.js";

/**
 * Device configuration operations on the Local Terminal (P2P) API.
 *
 * These control the physical terminal device directly: screen wake/sleep and
 * display brightness.
 *
 * @see /pos/v1/awake-lock, /pos/v1/brightness
 */
export class Device {
  constructor(private readonly http: HttpClient) {}

  /**
   * Control the device screen / sleep mode — POST /pos/v1/awake-lock.
   *
   * @param wakeUpLock When `true`, the device wakes from sleep and the screen
   *   stays active until the user unlocks it. When `false`, the device reverts
   *   to its normal sleep behavior.
   */
  screenControl(wakeUpLock: boolean): Promise<DeviceResponse> {
    return this.http.post<DeviceResponse>("/pos/v1/awake-lock", { wakeUpLock });
  }

  /**
   * Adjust the terminal app brightness — POST /pos/v1/brightness.
   *
   * @param brightness Value in the range (0, 1], where 1.00 is maximum
   *   brightness. A value of 0 is NOT allowed.
   * @throws {RangeError} If `brightness` is not within (0, 1].
   */
  brightness(brightness: number): Promise<DeviceResponse> {
    if (!(brightness > 0) || brightness > 1) {
      throw new RangeError(
        "brightness must be greater than 0 and at most 1.0 (0 is not allowed).",
      );
    }

    return this.http.post<DeviceResponse>("/pos/v1/brightness", { brightness });
  }
}
