import { WebAuthnService } from "../auth/WebAuthnService";
import { KeySet, SessionSettings, UserCredentials } from "../types";
import EncryptionService from "../EncryptionService";
import { SecureMemory } from "../security/SecureMemory";

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
      // Store in secure memory first
      SecureMemory.getInstance().storeSensitiveData("current_keys", Keys);

      // Then store encrypted version in chrome storage
      await chrome.storage.local.set({
        [this.STORAGE_KEYS.PROTECTED_DATA]: {
          ...Keys,
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
        console.log("###########################No Keys found.");
        return null;
      }

      // Store in secure memory for future use
      SecureMemory.getInstance().storeSensitiveData("current_keys", Keys);
      console.log("###########################Keys retrieved:", Keys);
      return Keys;
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
          ...settings,
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
      const updatedSettings = {
        ...currentSettings,
        ...newSettings,
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
