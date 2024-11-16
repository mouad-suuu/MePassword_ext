import EncryptionService from "../EncryptionService";
import { KeyStorage } from "../storage/KeyStorage";
import { LocalStorageManager } from "../storage/LocalStorageManager";
import { APISettingsPayload, KeySet, SessionSettings } from "../types";
import AdditionalMethods from "../Keys-managment/additionals";

export class SessionManagementService {
  private settings: SessionSettings;

  constructor(userSettings: Partial<SessionSettings> = {}) {
    this.settings = {
      autoLockTime: 0, // 5 minutes
      sessionTime: 0, // 24 hours
      sessionStart: 0,
      pushNotifications: false,
      biometricVerification: false,
      biometricType: "fingerprint",
      autoLockStart: 0,
      sessionExpiry: 0,
      lastAccessTime: 0,
      ...userSettings,
    } as SessionSettings;
  }

  // Simplify static methods to focus on core functionality
  private static sessionSettings: SessionSettings | null = null;
  private static keys: KeySet | null = null;

  public static async initialize(): Promise<void> {
    try {
      console.log("Static initialize called");
      const defaultSettings: SessionSettings = {
        autoLockTime: 1000 * 60 * 5,
        sessionTime: 86400000 * 30,
        sessionStart: Date.now(),
        pushNotifications: false,
        biometricVerification: false,
        biometricType: "fingerprint",
        autoLockStart: Date.now(),
        sessionExpiry: Date.now() + 86400000 * 30,
        lastAccessTime: Date.now(),
      };
      await KeyStorage.storeSettings(defaultSettings);
      await SessionManagementService.updateSessionSettings(defaultSettings);
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
    const settingsType: Partial<APISettingsPayload> = {
      sessionSettings: newSettings,
    };
    await EncryptionService.API.SettingsPut(settingsType);
    console.log("Session settings updated in storage.");
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
   * Checks if the session has expired based on session time settings.
   * Ends the session if the time has exceeded.
   */
  public async checkSessionExpiration(): Promise<boolean> {
    try {
      const settings = await KeyStorage.getSettingsFromStorage();

      // If no settings exist, we consider the session expired
      if (!settings || Object.keys(settings).length === 0) {
        console.log("No settings found, considering session expired");
        return true;
      }

      if (!settings.sessionStart || !settings.sessionTime) {
        console.log("Invalid session settings: missing required fields");
        return true;
      }

      const currentTime = Date.now();
      const sessionExpiry = settings.sessionStart + settings.sessionTime;
      const remainingTime = sessionExpiry - currentTime;

      AdditionalMethods.logTime("Time until session expiry", remainingTime);
      AdditionalMethods.logTime("Session duration", settings.sessionTime);

      return currentTime >= sessionExpiry;
    } catch (error) {
      console.log("Failed to check session expiration:", error);
      return true;
    }
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
  public async checkShortLockExpiration(): Promise<boolean> {
    const settings = await KeyStorage.getSettingsFromStorage();
    const currentTime = Date.now();
    const shortLockExpiry = settings.autoLockStart + settings.autoLockTime;
    const remainingTime = shortLockExpiry - currentTime;

    AdditionalMethods.logTime("Time until short lock expiry", remainingTime);
    AdditionalMethods.logTime("Short lock duration", settings.autoLockTime);

    return currentTime <= shortLockExpiry;
  }

  /**
   * Manually triggers short-lock to end early, requiring re-authentication.
   */
  public async endShortLock() {
    const settings = await KeyStorage.getSettingsFromStorage();
    await KeyStorage.updateSettings({
      autoLockStart: settings.autoLockStart + settings.autoLockTime,
    });
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
}
