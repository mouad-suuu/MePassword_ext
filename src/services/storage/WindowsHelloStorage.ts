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
          ...Keys,
          lastUpdated: Date.now(),
        },
      });
    } catch (error) {
      console.error("Error storing session data:", error);
      throw error;
    }
  }

  /**
   * Retrieves session data if not expired
   */
  public static async getKeysFromStorage(): Promise<KeySet | null> {
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
      const Keys = result[this.STORAGE_KEYS.PROTECTED_DATA];

      if (!Keys) {
        return null;
      }

      // Store in secure memory for future use
      SecureMemory.getInstance().storeSensitiveData("current_keys", Keys);
      return Keys;
    } catch (error) {
      console.error("Error retrieving session data:", error);
      throw error;
    }
  }
  public static async storeSettings(settings: SessionSettings): Promise<void> {
    try {
      await chrome.storage.local.set({
        [this.STORAGE_KEYS.SESSION_DATA]: {
          ...settings,
          lastUpdated: Date.now(),
        },
      });
    } catch (error) {
      console.error("Error storing session data:", error);
      throw error;
    }
  }

  /**
   * Retrieves session data if not expired
   */
  public static async getSettingsFromStorage(): Promise<SessionSettings | null> {
    try {
      const result = await chrome.storage.local.get([
        this.STORAGE_KEYS.SESSION_DATA,
      ]);
      const sessionData = result[this.STORAGE_KEYS.SESSION_DATA];

      if (!sessionData) {
        return null;
      }

      // Check if session has expired
      const currentTime = Date.now();
      if (currentTime > sessionData.sessionExpiry) {
        await this.clearSessionData();
        return null;
      }

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
    try {
      await chrome.storage.local.clear();
    } catch (error) {
      console.error("Error clearing storage:", error);
      throw error;
    }
  }

  /**
   * Clears only session data
   */
  public static async clearSessionData(): Promise<void> {
    try {
      await chrome.storage.local.remove([this.STORAGE_KEYS.SESSION_DATA]);
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
    try {
      const currentSettings = await this.getSettingsFromStorage();
      const updatedSettings = {
        ...currentSettings,
        ...newSettings,
        lastUpdated: Date.now(),
      };
      await this.storeSettings(updatedSettings);
    } catch (error) {
      console.error("Error updating session settings:", error);
      throw error;
    }
  }
}
