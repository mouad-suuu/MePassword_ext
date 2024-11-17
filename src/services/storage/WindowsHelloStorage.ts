import { WebAuthnService } from "../auth/WebAuthnService";
import { KeySet, SessionSettings, UserCredentials } from "../types";
import EncryptionService from "../EncryptionService";

export class SecureStorageService {
  private static readonly STORAGE_KEYS = {
    PROTECTED_DATA: "protectedData",
    SESSION_DATA: "sessionData",
    PUBLIC_DATA: "publicData",
  };

  /**
   * Stores sensitive data (KeySet) using Windows Hello protection
   */
  // public static async storeProtectedData(data: KeySet): Promise<void> {
  //   try {
  //     // First, verify biometric authentication
  //     const isAuthenticated = await WebAuthnService.verifyBiometric();
  //     if (!isAuthenticated) {
  //       throw new Error(
  //         "Biometric authentication required for storing protected data"
  //       );
  //     }

  //     // Encrypt the sensitive data
  //     const encoder = new TextEncoder();
  //     const dataBuffer = encoder.encode(JSON.stringify(data));

  //     // Generate a new AES key for data encryption
  //     const aesKey = await crypto.subtle.generateKey(
  //       { name: "AES-GCM", length: 256 },
  //       true,
  //       ["encrypt", "decrypt"]
  //     );

  //     // Generate random IV
  //     const iv = crypto.getRandomValues(new Uint8Array(12));

  //     // Encrypt the data
  //     const encryptedData = await crypto.subtle.encrypt(
  //       { name: "AES-GCM", iv },
  //       aesKey,
  //       dataBuffer
  //     );

  //     // Export the AES key
  //     const exportedKey = await crypto.subtle.exportKey("raw", aesKey);

  //     // Store the encrypted data and IV
  //     const storageData = {
  //       encryptedData: Array.from(new Uint8Array(encryptedData)),
  //       iv: Array.from(iv),
  //       key: Array.from(new Uint8Array(exportedKey)),
  //     };

  //     await chrome.storage.local.set({
  //       [this.STORAGE_KEYS.PROTECTED_DATA]: storageData,
  //     });
  //   } catch (error) {
  //     console.error("Error storing protected data:", error);
  //     throw error;
  //   }
  // }

  // /**
  //  * Retrieves protected data using Windows Hello verification
  //  */
  // public static async getProtectedData(): Promise<KeySet | null> {
  //   try {
  //     // Verify biometric authentication
  //     const isAuthenticated = await WebAuthnService.verifyBiometric();
  //     if (!isAuthenticated) {
  //       throw new Error(
  //         "Biometric authentication required for accessing protected data"
  //       );
  //     }

  //     const result = await chrome.storage.local.get([
  //       this.STORAGE_KEYS.PROTECTED_DATA,
  //     ]);
  //     const storageData = result[this.STORAGE_KEYS.PROTECTED_DATA];

  //     if (!storageData) {
  //       return null;
  //     }

  //     // Import the AES key
  //     const keyBuffer = new Uint8Array(storageData.key);
  //     const aesKey = await crypto.subtle.importKey(
  //       "raw",
  //       keyBuffer,
  //       { name: "AES-GCM", length: 256 },
  //       false,
  //       ["decrypt"]
  //     );

  //     // Decrypt the data
  //     const decryptedBuffer = await crypto.subtle.decrypt(
  //       { name: "AES-GCM", iv: new Uint8Array(storageData.iv) },
  //       aesKey,
  //       new Uint8Array(storageData.encryptedData)
  //     );

  //     const decoder = new TextDecoder();
  //     const decryptedData = JSON.parse(decoder.decode(decryptedBuffer));
  //     return decryptedData as KeySet;
  //   } catch (error) {
  //     console.error("Error retrieving protected data:", error);
  //     throw error;
  //   }
  // }

  /**
   * Stores session data with automatic expiration
   */

  public static async storeKeys(Keys: KeySet): Promise<void> {
    console.log("###########################Storing keys:", Keys);
    try {
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
      const result = await chrome.storage.local.get([
        this.STORAGE_KEYS.PROTECTED_DATA,
      ]);
      const Keys = result[this.STORAGE_KEYS.PROTECTED_DATA];

      if (!Keys) {
        console.log("###########################No Keys found.");
        return null;
      }

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
