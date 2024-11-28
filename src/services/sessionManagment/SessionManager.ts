import EncryptionService from "../EncryptionService";
import { KeyStorage } from "../storage/KeyStorage";
import { APISettingsPayload, KeySet, SessionSettings } from "../types";
import AdditionalMethods from "../Keys-managment/additionals";
import { WebAuthnService } from "../auth&security/WebAuthnService";
import StorageService from "../StorageService";

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
      const defaultSettings: SessionSettings = {
        autoLockTime: 1000 * 60 * 5,
        sessionTime: 86400000 * 30,
        sessionStart: Date.now(),
        pushNotifications: false,
        biometricVerification: false,
        biometricType: "none",
        autoLockStart: Date.now(),
        sessionExpiry: Date.now() + 86400000 * 30,
        lastAccessTime: Date.now(),
      };
      await StorageService.SecureStorage.storeSettings(defaultSettings);
      await SessionManagementService.updateSessionSettings(defaultSettings);
    } catch (error) {
      console.error("Failed to initialize session:", error);
    }
  }

  public static async getSessionSettings(): Promise<SessionSettings> {
    if (!this.sessionSettings) {
      try {
        this.sessionSettings = await KeyStorage.getSettingsFromStorage();
      } catch (error) {
        console.error("Failed to get settings:", error);
        throw error;
      }
    } else {
    }
    return this.sessionSettings;
  }

  public static async updateSessionSettings(
    newSettings: Partial<SessionSettings>
  ): Promise<void> {
    this.sessionSettings = {
      ...this.sessionSettings,
      ...newSettings,
    } as SessionSettings;
    await StorageService.SecureStorage.storeSettings(this.sessionSettings);
    const responce = await EncryptionService.API.SettingGet();
    const settings = await responce.json();
    const settingsType: APISettingsPayload = {
      publicKey: settings.publicKey,
      deviceId: settings.deviceId,
      timestamp: settings.timestamp,
      password: settings.password,
      sessionSettings: this.sessionSettings,
    };
    await EncryptionService.API.SettingsPut(settingsType);
  }

  public static async getKeys(): Promise<KeySet> {
    if (!this.keys) {
      this.keys = await KeyStorage.getKeysFromStorage();
    } else {
    }
    return this.keys;
  }

  public static async updateKeys(newKeys: KeySet): Promise<void> {
    this.keys = newKeys;
    await KeyStorage.storeKeys(newKeys);
  }

  public static async clearSession(): Promise<void> {
    await StorageService.SecureStorage.storeSettings({} as SessionSettings);
    await KeyStorage.storeKeys({} as KeySet);
    this.sessionSettings = null;
    this.keys = null;
  }

  /**
   * Checks if the session has expired based on session time settings.
   * Ends the session if the time has exceeded.
   */
  public async checkSessionExpiration(): Promise<boolean> {
    try {
      const settings = await KeyStorage.getSettingsFromStorage();

      // If no settings exist, we consider the session expired
      if (!settings) {
        return true;
      }

      if (!settings.sessionStart || !settings.sessionTime) {
        return true;
      }

      const currentTime = Date.now();
      const sessionExpiry = settings.sessionStart + settings.sessionTime;
      const remainingTime = sessionExpiry - currentTime;

      AdditionalMethods.logTime("Time until session expiry", remainingTime);
      AdditionalMethods.logTime("Session duration", settings.sessionTime);

      return currentTime >= sessionExpiry;
    } catch (error) {
      return true;
    }
  }

  /**
   * Starts a short-lock timer for quick reauthentication within a limited time.
   * Should be called upon successful password entry or biometric verification.
   */
  public async startShortLockTimer() {
    try {
      const settings = await KeyStorage.getSettingsFromStorage();
      const updatedSettings = {
        ...settings,
        autoLockStart: Date.now(),
        lastAccessTime: Date.now(),
      };
      await KeyStorage.updateSettings(updatedSettings);
    } catch (error) {
      console.error("Failed to start short lock timer:", error);
      throw error;
    }
  }

  /**
   * Checks if the short-lock timer has expired based on auto-lock settings.
   * Returns true if the user needs to re-authenticate, false otherwise.
   */
  public async checkShortLockExpiration(): Promise<boolean> {
    try {
      const settings = await KeyStorage.getSettingsFromStorage();
      if (!settings?.autoLockStart || !settings?.autoLockTime) {
        return false;
      }

      const currentTime = Date.now();
      const shortLockExpiry = settings.autoLockStart + settings.autoLockTime;
      const remainingTime = shortLockExpiry - currentTime;

      AdditionalMethods.logTime("Time until short lock expiry", remainingTime);
      AdditionalMethods.logTime("Short lock duration", settings.autoLockTime);

      return currentTime <= shortLockExpiry;
    } catch (error) {
      console.error("Error checking short lock expiration:", error);
      return false;
    }
  }

  /**
   * Manually triggers short-lock to end early, requiring re-authentication.
   */
  public async endShortLock() {
    await KeyStorage.updateSettings({
      autoLockTime: 0,
    });
  }

  /**
   * Enable or disable biometric authentication based on settings.
   * Ensures that biometric setup is available on the device.
   */
  async configureBiometric(enable: boolean = true) {
    try {
      if (enable) {
        const isSupported = await WebAuthnService.isWebAuthnSupported();
        if (!isSupported) {
          throw new Error(
            "Biometric authentication is not supported on this device"
          );
        }

        const username = "user"; // Get this from your user management system
        const registered = await WebAuthnService.registerBiometric(username);

        if (registered) {
          const biometricType = WebAuthnService.detectBiometricType();
          const settings = await SessionManagementService.getSessionSettings();

          const updatedSettings = {
            ...settings,
            biometricVerification: true,
            biometricType: biometricType,
          };

          await SessionManagementService.updateSessionSettings(updatedSettings);
        } else {
          throw new Error("Failed to register biometric");
        }
      } else {
        const settings = await SessionManagementService.getSessionSettings();
        const updatedSettings = {
          ...settings,
          biometricVerification: false,
          biometricType: "none" as const,
        };

        await SessionManagementService.updateSessionSettings(updatedSettings);
      }
    } catch (error) {
      console.error("Error in configureBiometric:", error);
      throw error;
    }
  }

  public async checkBiometricType(): Promise<"face" | "fingerprint" | "none"> {
    return WebAuthnService.detectBiometricType();
  }
}
