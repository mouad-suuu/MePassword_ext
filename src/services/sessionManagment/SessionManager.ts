import { KeyStorage } from "../storage/KeyStorage";
import { LocalStorageManager } from "../storage/LocalStorageManager";
import { KeySet, SessionSettings } from "../types";

export class SessionManagementService {
  private settings: SessionSettings;
  private sessionActive: boolean = false;

  constructor(userSettings: Partial<SessionSettings> = {}) {
    console.log("SessionManagementService constructor called", userSettings);
    // Simplify initial settings
    this.settings = {
      autoLockTime: 1800000, // 30 minutes
      sessionTime: 86400000, // 24 hours
      sessionStart: Date.now(),
      pushNotifications: false,
      biometricVerification: false,
      biometricType: "fingerprint",
      autoLockStart: Date.now(),
      sessionExpiry: Date.now() + 86400000,
      lastAccessTime: Date.now(),
      ...userSettings,
    };
    console.log("Initialized settings:", this.settings);
  }

  // Simplify static methods to focus on core functionality
  private static sessionSettings: SessionSettings | null = null;
  private static keys: KeySet | null = null;

  public static async initialize(): Promise<void> {
    console.log("Static initialize called");
    try {
      this.sessionSettings = await KeyStorage.getSettingsFromStorage();
      this.keys = await KeyStorage.getKeysFromStorage();
      console.log("Session initialized successfully:", {
        settings: this.sessionSettings,
        hasKeys: !!this.keys,
      });
    } catch (error) {
      console.error("Failed to initialize session:", error);
    }
  }

  public static async getSessionSettings(): Promise<SessionSettings> {
    console.log("Getting session settings");
    if (!this.sessionSettings) {
      try {
        this.sessionSettings = await KeyStorage.getSettingsFromStorage();
        console.log("Retrieved settings from storage:", this.sessionSettings);
      } catch (error) {
        console.error("Failed to get settings:", error);
        throw error;
      }
    }
    return this.sessionSettings;
  }

  public static async updateSessionSettings(
    newSettings: SessionSettings
  ): Promise<void> {
    this.sessionSettings = newSettings;
    console.log("Updating session settings.");
    await KeyStorage.storeSettings(newSettings);
    console.log("Session settings updated successfully.");
  }

  public static async getKeys(): Promise<KeySet> {
    if (!this.keys) {
      console.log("Keys not found in memory, retrieving from storage.");
      this.keys = await KeyStorage.getKeysFromStorage();
    }
    return this.keys;
  }

  public static async updateKeys(newKeys: KeySet): Promise<void> {
    this.keys = newKeys;
    console.log("Updating keys.");
    await KeyStorage.storeKeys(newKeys);
    console.log("Keys updated successfully.");
  }

  public static async clearSession(): Promise<void> {
    console.log("Clearing session data.");
    await KeyStorage.storeSettings({} as SessionSettings);
    await KeyStorage.storeKeys({} as KeySet);
    this.sessionSettings = null;
    this.keys = null;
    console.log("Session data cleared.");
  }
  /**
   * Initialize session settings. Fetch settings from the user's server if available and merge.
   * Call this method during login or when the app initializes.
   */
  async initializeSession() {
    const serverSettings = await KeyStorage.getSettingsFromStorage();
    this.settings = { ...this.settings, ...serverSettings };
    this.startSessionTimer();
  }

  /**
   * Starts a new session timer and updates sessionStart.
   * This is used to track the overall session duration.
   */
  private startSessionTimer() {
    this.settings.sessionStart = Date.now();
    this.sessionActive = true;
  }

  /**
   * Checks if the session has expired based on session time settings.
   * Ends the session if the time has exceeded.
   */
  checkSessionExpiration() {
    const currentTime = Date.now();
    const sessionExpiry =
      this.settings.sessionStart + this.settings.sessionTime;
    if (currentTime >= sessionExpiry) {
      this.endSession();
    }
  }

  /**
   * Ends the current session and clears any local data.
   */
  endSession() {
    LocalStorageManager.clearStorage();
    this.sessionActive = false;
    // Additional actions such as redirecting to login or showing a notification
  }

  /**
   * Starts a short-lock timer for quick reauthentication within a limited time.
   * Should be called upon successful password entry or biometric verification.
   */
  startShortLockTimer() {
    this.settings.autoLockStart = Date.now();
  }

  /**
   * Checks if the short-lock timer has expired based on auto-lock settings.
   * Returns true if the user needs to re-authenticate, false otherwise.
   */
  checkShortLockExpiration(): boolean {
    const currentTime = Date.now();
    const shortLockExpiry =
      this.settings.autoLockStart + this.settings.autoLockTime;
    return currentTime >= shortLockExpiry;
  }

  /**
   * Manually triggers short-lock to end early, requiring re-authentication.
   */
  endShortLock() {
    this.settings.autoLockStart = 0;
  }

  /**
   * Enable or disable biometric authentication based on settings.
   * Ensures that biometric setup is available on the device.
   */
  async configureBiometric() {
    if (this.settings.biometricVerification) {
      const isSupported = await this.checkBiometricSupport();
      if (!isSupported) {
        throw new Error(
          `Biometric type ${this.settings.biometricType} is not supported.`
        );
      }
      // Proceed with biometric setup if supported
    }
  }

  /**
   * Checks if the device supports the specified biometric type.
   * @returns boolean - True if supported, false otherwise.
   */
  private async checkBiometricSupport(): Promise<boolean> {
    // Implement device-specific biometric check
    return true; // Placeholder
  }

  /**
   * Save session settings to the user's server for persistence between logins.
   * This replaces centralized storage and ensures security within the user's environment.
   */
  async saveSessionSettings() {
    // Implement a call to save settings directly to the user's server
  }
}
