import { WebAuthnService } from "../auth&security/WebAuthnService";
import { KeySet, SessionSettings, UserCredentials } from "../types";
import EncryptionService from "../EncryptionService";
import { SecureMemory } from "../auth&security/SecureMemory";
import { WindowsHelloVerifier } from "../auth&security/WindowsHelloVerifier";

export class SecureStorageService {
  private static readonly STORAGE_KEYS = {
    PROTECTED_DATA: "protectedData",
    SESSION_DATA: "sessionData",
    PUBLIC_DATA: "publicData",
  };

  /**
   * Stores session data with automatic expiration
   */

  public static async storeKeys(Keys: KeySet): Promise<void> {
    console.log("###########################Storing keys:", Keys);
    try {
      // Verify identity before storing keys
      const verified = await WindowsHelloVerifier.getInstance().verifyIdentity(
        "store_keys"
      );
      if (!verified) {
        throw new Error("Identity verification failed");
      }

      // Store in secure memory first
      SecureMemory.getInstance().storeSensitiveData("current_keys", Keys);

      // Then store encrypted version in chrome storage
      await chrome.storage.local.set({
        [this.STORAGE_KEYS.PROTECTED_DATA]: {
          privateKey: Keys.privateKey,
          AESKey: Keys.AESKey,
          IV: Keys.IV,
          Credentials: Keys.Credentials,
          lastUpdated: Date.now(),
        },
      });
      console.log("###########################Keys stored successfully.");
    } catch (error) {
      console.error("Error storing session data:", error);
      throw error;
    }
  }

  /**
   * Retrieves session data if not expired
   */
  public static async getKeysFromStorage(): Promise<KeySet | null> {
    console.log("###########################Retrieving keys from storage...");
    try {
      // Verify identity before retrieving keys
      const verified = await WindowsHelloVerifier.getInstance().verifyIdentity(
        "get_keys"
      );
      if (!verified) {
        throw new Error("Identity verification failed");
      }

      // Try to get from secure memory first
      const memoryKeys =
        SecureMemory.getInstance().getSensitiveData<KeySet>("current_keys");
      if (memoryKeys) {
        return memoryKeys;
      }

      // Fall back to chrome storage
      const result = await chrome.storage.local.get([
        this.STORAGE_KEYS.PROTECTED_DATA,
      ]);
      const storedKeys = result[this.STORAGE_KEYS.PROTECTED_DATA];

      if (!storedKeys) {
        console.log("###########################No Keys found.");
        return null;
      }

      // Normalize key names to match KeySet interface
      const normalizedKeys: KeySet = {
        privateKey: storedKeys.privateKey || storedKeys.privatekey,
        AESKey: storedKeys.AESKey || storedKeys.AESkey,
        IV: storedKeys.IV,
        Credentials: storedKeys.Credentials || storedKeys.credentials,
      };

      // Validate the keys
      if (!normalizedKeys.privateKey || !normalizedKeys.AESKey || !normalizedKeys.IV || !normalizedKeys.Credentials) {
        console.error("###########################Invalid keys format:", normalizedKeys);
        throw new Error("Invalid keys format in storage");
      }

      // Store normalized keys in secure memory for future use
      SecureMemory.getInstance().storeSensitiveData("current_keys", normalizedKeys);
      console.log("###########################Keys retrieved and normalized:", normalizedKeys);
      return normalizedKeys;
    } catch (error) {
      console.error("Error retrieving session data:", error);
      throw error;
    }
  }

  public static async storeSettings(settings: SessionSettings): Promise<void> {
    console.log("###########################Storing settings:", settings);
    try {
      await chrome.storage.local.set({
        [this.STORAGE_KEYS.SESSION_DATA]: {
          pushNotifications: settings.pushNotifications,
          autoLockTime: settings.autoLockTime,
          autoLockStart: settings.autoLockStart,
          sessionStart: settings.sessionStart,
          sessionTime: settings.sessionTime,
          sessionExpiry: settings.sessionExpiry,
          lastAccessTime: settings.lastAccessTime,
          biometricVerification: settings.biometricVerification,
          biometricType: settings.biometricType,
          biometricPassword: settings.biometricPassword,
          lockOnLeave: settings.lockOnLeave,
          lastUpdated: Date.now(),
        },
      });
      console.log("###########################Settings stored successfully.");
    } catch (error) {
      console.error("Error storing session data:", error);
      throw error;
    }
  }

  /**
   * Retrieves session data if not expired
   */
  public static async getSettingsFromStorage(): Promise<SessionSettings | null> {
    console.log(
      "###########################Retrieving settings from storage..."
    );
    try {
      const result = await chrome.storage.local.get([
        this.STORAGE_KEYS.SESSION_DATA,
      ]);
      const sessionData = result[this.STORAGE_KEYS.SESSION_DATA];

      if (!sessionData) {
        console.log("###########################No session settings found.");
        return null;
      }

      // Check if session has expired
      const currentTime = Date.now();
      if (currentTime > sessionData.sessionExpiry) {
        console.log(
          "###########################Session has expired, clearing session data."
        );
        await this.clearSessionData();
        return null;
      }

      console.log(
        "###########################Session settings retrieved:",
        sessionData
      );
      return sessionData;
    } catch (error) {
      console.error("Error retrieving session data:", error);
      throw error;
    }
  }

  /**
   * Clears all stored data
   */
  public static async clearAllData(): Promise<void> {
    console.log("###########################Clearing all stored data...");
    try {
      await chrome.storage.local.clear();
      console.log("###########################All data cleared successfully.");
    } catch (error) {
      console.error("Error clearing storage:", error);
      throw error;
    }
  }

  /**
   * Clears only session data
   */
  public static async clearSessionData(): Promise<void> {
    console.log("###########################Clearing session data...");
    try {
      await chrome.storage.local.remove([this.STORAGE_KEYS.SESSION_DATA]);
      console.log(
        "###########################Session data cleared successfully."
      );
    } catch (error) {
      console.error("Error clearing session data:", error);
      throw error;
    }
  }

  /**
   * Updates the session settings
   */
  public static async updateSettings(
    newSettings: SessionSettings
  ): Promise<void> {
    console.log(
      "###########################Updating settings with:",
      newSettings
    );
    try {
      const currentSettings = await this.getSettingsFromStorage();
      const updatedSettings: SessionSettings = {
        autoLockTime: newSettings.autoLockTime ?? currentSettings?.autoLockTime,
        sessionTime: newSettings.sessionTime ?? currentSettings?.sessionTime,
        sessionStart: newSettings.sessionStart ?? currentSettings?.sessionStart,
        pushNotifications: newSettings.pushNotifications ?? currentSettings?.pushNotifications,
        biometricVerification: newSettings.biometricVerification ?? currentSettings?.biometricVerification,
        biometricType: newSettings.biometricType ?? currentSettings?.biometricType,
        autoLockStart: newSettings.autoLockStart ?? currentSettings?.autoLockStart,
        sessionExpiry: newSettings.sessionExpiry ?? currentSettings?.sessionExpiry,
        lastAccessTime: newSettings.lastAccessTime ?? currentSettings?.lastAccessTime,
        lastUpdated: Date.now(),
      };
      await this.storeSettings(updatedSettings);
      console.log("###########################Settings updated successfully.");
    } catch (error) {
      console.error("Error updating session settings:", error);
      throw error;
    }
  }
}
