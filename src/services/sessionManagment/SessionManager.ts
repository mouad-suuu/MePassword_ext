import { SessionEncryptionService } from "../Keys-managment/SessionEncryptionService";
import { KeyStorage } from "../storage/KeyStorage";
import { APISettingsPayload, KeySet, SessionSettings } from "../types";
import AdditionalMethods from "../Keys-managment/additionals";
import { WebAuthnService } from "../auth&security/WebAuthnService";
import StorageService from "../StorageService";
import EncryptionService from "../EncryptionService";

export class SessionManagementService {
  private settings: SessionSettings;

  constructor(userSettings: Partial<SessionSettings> = {}) {
    this.settings = {
      autoLockTime: 5 * 60 * 1000, // 5 minutes
      sessionTime: 30 * 24 * 60 * 60 * 1000, // 30 days
      sessionStart: Date.now(),
      pushNotifications: false,
      biometricVerification: false,
      biometricType: "fingerprint",
      autoLockStart: Date.now(),
      sessionExpiry: Date.now(),
      lastAccessTime: Date.now(),
      ...userSettings,
    } as SessionSettings;
  }

  // Simplify static methods to focus on core functionality
  private static sessionSettings: SessionSettings | null = null;
  private static keys: KeySet | null = null;

  public static async initialize(): Promise<void> {
    try {
      console.log("Static initialize called");
      const timestamp = Date.now();
      const defaultSettings: SessionSettings = {
        autoLockTime: 1000 * 60 * 5, // 5 minutes
        sessionTime: 86400000 * 30, // 30 days
        sessionStart: timestamp,
        pushNotifications: false,
        biometricVerification: false,
        biometricType: "none",
        autoLockStart: timestamp,
        sessionExpiry: timestamp + (86400000 * 30),
        lastAccessTime: timestamp,
      };

      // Add a small delay to ensure keys are stored
      await new Promise(resolve => setTimeout(resolve, 500));

      // Get stored keys to access userId with retry logic
      let storedKeys = null;
      let retryCount = 0;
      const maxRetries = 3;

      while (!storedKeys?.Credentials && retryCount < maxRetries) {
        console.log(`Attempt ${retryCount + 1} to get stored keys`);
        storedKeys = await StorageService.Keys.getKeysFromStorage();
        if (!storedKeys?.Credentials) {
          retryCount++;
          if (retryCount < maxRetries) {
            await new Promise(resolve => setTimeout(resolve, 500));
          }
        }
      }

      if (!storedKeys?.Credentials) {
        throw new Error("No stored credentials found after retries");
      }

      console.log("Successfully retrieved stored keys");

      // Decrypt credentials to get userId
      const decryptedCredentials = await EncryptionService.CredentialCrypto.decryptCredentials(
        storedKeys.Credentials,
        {
          key: storedKeys.AESKey,
          iv: storedKeys.IV,
          algorithm: "AES-GCM",
          length: 256
        }
      );

      if (!decryptedCredentials.userId) {
        throw new Error("No userId found in decrypted credentials");
      }

      console.log("Successfully decrypted credentials, userId:", decryptedCredentials.userId);

      // Construct the settings payload
      const settingsPayload: Partial<APISettingsPayload> = {
        userId: decryptedCredentials.userId,
        sessionSettings: { ...defaultSettings }, // Create a new object to avoid reference issues
        timestamp: timestamp,
        deviceId: crypto.randomUUID(), // Add a unique device ID
      };

      // Validate the payload before sending
      if (!settingsPayload.userId || !settingsPayload.sessionSettings) {
        throw new Error("Invalid settings payload");
      }

      console.log("Sending settings to the API with payload:", {
        userId: settingsPayload.userId,
        hasSessionSettings: !!settingsPayload.sessionSettings,
        timestamp: settingsPayload.timestamp,
        deviceId: settingsPayload.deviceId
      });

      await EncryptionService.API.SettingsPut(settingsPayload as Partial<APISettingsPayload>);

      console.log("Sending settings to the storage");
      await StorageService.SecureStorage.storeSettings(defaultSettings);
      await SessionManagementService.updateSessionSettings(defaultSettings);
      console.log("Session initialized with default settings");
    } catch (error) {
      console.error("Failed to initialize session:", error);
      throw error;
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
    } else {
      console.log("Using cached session settings:", this.sessionSettings);
    }
    return this.sessionSettings;
  }

  public static async updateSessionSettings(
    newSettings: Partial<SessionSettings>
  ): Promise<void> {
    try {
      console.log("Updating session settings");

      // Get stored keys to access userId
      const storedKeys = await StorageService.Keys.getKeysFromStorage();
      if (!storedKeys?.Credentials) {
        throw new Error("No stored credentials found");
      }

      // Decrypt credentials to get userId
      const decryptedCredentials = await EncryptionService.CredentialCrypto.decryptCredentials(
        storedKeys.Credentials,
        {
          key: storedKeys.AESKey,
          iv: storedKeys.IV,
          algorithm: "AES-GCM",
          length: 256
        }
      );

      if (!decryptedCredentials.userId) {
        throw new Error("No userId found in decrypted credentials");
      }

      // Update local session settings
      this.sessionSettings = {
        ...this.sessionSettings,
        ...newSettings,
      } as SessionSettings;

      // Store settings locally
      console.log("Storing settings locally");
      await StorageService.SecureStorage.storeSettings(this.sessionSettings);

      // Get current settings from server
      console.log("Getting current settings from server");
      const response = await SessionEncryptionService.API.SettingGet();
      const currentSettings = await response.json();

      // Prepare settings payload
      const settingsPayload: Partial<APISettingsPayload> = {
        userId: decryptedCredentials.userId,
        publicKey: currentSettings.settings?.publicKey,
        deviceId: currentSettings.settings?.deviceId || crypto.randomUUID(),
        timestamp: Date.now(),
        sessionSettings: this.sessionSettings
      };

      // Update settings on server
      console.log("Updating settings on server");
      await EncryptionService.API.SettingsPut(settingsPayload as Partial<APISettingsPayload>);

      console.log("Session settings updated successfully");
    } catch (error) {
      console.error("Failed to update session settings:", error);
      throw error;
    }
  }

  public static async getKeys(): Promise<KeySet> {
    if (!this.keys) {
      console.log("Keys not found in memory, retrieving from storage.");
      this.keys = await KeyStorage.getKeysFromStorage();
      console.log("Keys retrieved from storage:", this.keys);
    } else {
      console.log("Using cached keys:", this.keys);
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
    try {
      // Clear local storage
      await StorageService.SecureStorage.storeSettings({} as SessionSettings);
      await KeyStorage.storeKeys({} as KeySet);
      
      // Clear memory
      this.sessionSettings = null;
      this.keys = null;
      
      // Clear server settings if possible
      try {
        await EncryptionService.API.SettingsPut({} as APISettingsPayload);
      } catch (error) {
        console.warn("Could not clear server settings:", error);
      }
      
      console.log("Session data cleared successfully.");
    } catch (error) {
      console.error("Error clearing session data:", error);
      throw error;
    }
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
    const settings = await KeyStorage.getSettingsFromStorage();
    await KeyStorage.updateSettings({
      ...settings,
      autoLockStart: 0, // Reset the lock  start time instead of the duration
      lastAccessTime: Date.now(),
    });
  }

  /**
   * Enable or disable biometric authentication based on settings.
   * Ensures that biometric setup is available on the device.
   */
  async configureBiometric(enable: boolean = true) {
    try {
      console.log("Configuring biometric:", enable);

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
          const currentSettings = await SessionManagementService.getSessionSettings();
          
          // Ensure we preserve all existing settings while updating biometric fields
          const updatedSettings: SessionSettings = {
            ...currentSettings,
            biometricVerification: true,
            biometricType: biometricType,
            // Ensure required fields have default values if they don't exist
            pushNotifications: currentSettings.pushNotifications ?? false,
            autoLockTime: currentSettings.autoLockTime ?? 300000, // 5 minutes default
            autoLockStart: currentSettings.autoLockStart ?? Date.now(),
            sessionStart: currentSettings.sessionStart ?? Date.now(),
            sessionTime: currentSettings.sessionTime ?? 2592000000, // 30 days default
            sessionExpiry: currentSettings.sessionExpiry ?? (Date.now() + 2592000000),
            lastAccessTime: Date.now(),
            lockOnLeave: currentSettings.lockOnLeave ?? false
          };

          await SessionManagementService.updateSessionSettings(updatedSettings);
          console.log("Biometric settings updated:", updatedSettings);
        } else {
          throw new Error("Failed to register biometric");
        }
      } else {
        const currentSettings = await SessionManagementService.getSessionSettings();
        const updatedSettings: SessionSettings = {
          ...currentSettings,
          biometricVerification: false,
          biometricType: "none" as const,
          // Ensure required fields have default values if they don't exist
          pushNotifications: currentSettings.pushNotifications ?? false,
          autoLockTime: currentSettings.autoLockTime ?? 300000, // 5 minutes default
          autoLockStart: currentSettings.autoLockStart ?? Date.now(),
          sessionStart: currentSettings.sessionStart ?? Date.now(),
          sessionTime: currentSettings.sessionTime ?? 2592000000, // 30 days default
          sessionExpiry: currentSettings.sessionExpiry ?? (Date.now() + 2592000000),
          lastAccessTime: Date.now(),
          lockOnLeave: currentSettings.lockOnLeave ?? false
        };

        await SessionManagementService.updateSessionSettings(updatedSettings);
        console.log("Biometric disabled:", updatedSettings);
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
