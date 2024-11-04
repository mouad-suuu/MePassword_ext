export class SessionManager<T> {
  /** Key used to store session data in chrome.storage.local */
  private readonly storageKey = "session_data";
  /** Key used to store session expiration timestamp in chrome.storage.local */
  private readonly expiryKey = "session_expiry";

  /**
   * Initializes a new session with the provided data and expiration period.
   * @param data The session data to store
   * @param daysValid Number of days the session should remain valid
   * @returns Promise that resolves when the session is stored
   */
  async startSession(data: T, daysValid: number): Promise<void> {
    const expiry = new Date();
    expiry.setDate(expiry.getDate() + daysValid);

    // Store session data
    await chrome.storage.local.set({
      [this.storageKey]: data,
      [this.expiryKey]: expiry.getTime(),
    });
  }

  /**
   * Retrieves the current session data if it exists and hasn't expired.
   * @returns Promise that resolves with the session data, or null if the session is invalid/expired
   */
  async getSessionData(): Promise<T | null> {
    const result = await chrome.storage.local.get([
      this.storageKey,
      this.expiryKey,
    ]);

    if (!result[this.storageKey] || !result[this.expiryKey]) {
      return null;
    }

    // Check if session is expired
    if (new Date().getTime() > result[this.expiryKey]) {
      await this.clearSession();
      return null;
    }

    return result[this.storageKey] as T;
  }

  /**
   * Removes all session data from storage.
   * @returns Promise that resolves when the session data has been cleared
   */
  async clearSession(): Promise<void> {
    await chrome.storage.local.remove([this.storageKey, this.expiryKey]);
  }

  /**
   * Checks if there is a valid, non-expired session.
   * @returns Promise that resolves to true if there is a valid session, false otherwise
   */
  async isSessionValid(): Promise<boolean> {
    const data = await this.getSessionData();
    return data !== null;
  }
}
