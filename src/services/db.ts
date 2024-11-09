// TODO: managing the database and local storage
// TODO: managing the deletion of data in the local storage
// we need functions to get the data from the local storage that will secure the access to the data, whitch is used to store the Keys in a the chosen session time (default 30 days) then delete them and ask for them again
// a delete function will be needed to delete the data from the local storage when the user log out
/**
 * Database and Storage Management Service
 * TODO: Implement the following functionalities:
 * 1. Secure Storage Interface:
 *    - Store encrypted keys with expiration
 *    - Store user preferences
 *    - Cache encrypted passwords for offline access
 *
 * 2. Key Management:
 *    - Store KeySet interface data securely
 *    - Handle key rotation
 *    - Manage biometric keys
 *
 * 3. Cleanup Operations:
 *    - Automatic cleanup of expired sessions
 *    - Secure data wiping on logout
 *    - Memory protection during runtime
 *
 * 4. Sync Management:
 *    - Queue offline changes
 *    - Handle conflict resolution
 *    - Maintain sync status
 */
import EncryptionService from "./Keys-managment/Encrypt";
import {
  KeySet,
  EncryptedPassword,
  ExtensionSettings,
  UserCredentials,
} from "./types";

class StoringService {
  private static readonly STORAGE_PREFIX = "password-manager-";
  private static readonly SESSION_DURATION = 30 * 24 * 60 * 60 * 1000; // 30 days

  public static async getKeysFromStorage(): Promise<KeySet | null> {
    try {
      console.log("Attempting to retrieve keys from storage.");
      const keysJSON = this.getFromStorageSync("keys");
      if (!keysJSON) {
        console.log("No keys found in storage.");
        return null;
      }
      const keys = JSON.parse(keysJSON) as KeySet;

      if (keys.lastRotated + StoringService.SESSION_DURATION < Date.now()) {
        console.log("Keys have expired, deleting from storage.");
        this.deleteFromStorageSync("keys");
        return null;
      }

      console.log("Keys retrieved successfully.");
      return keys;
    } catch (error) {
      console.error("Error retrieving keys from storage:", error);
      return null;
    }
  }

  public static async storeKeys(keys: KeySet): Promise<void> {
    try {
      console.log("Storing keys in storage.");
      console.log("Keys to be stored:", keys);
      this.storeInStorageSync("keys", JSON.stringify(keys));
      console.log("Keys stored successfully.", keys);
    } catch (error) {
      console.error("Error storing keys:", error);
    }
  }

  public static async getEncryptedPassword(
    id: string
  ): Promise<EncryptedPassword | null> {
    try {
      console.log(`Retrieving encrypted password for ID: ${id}`);
      const passwordJSON = this.getFromStorageSync(`password-${id}`);
      if (!passwordJSON) {
        console.log(`No password found for ID: ${id}`);
        return null;
      }
      console.log(`Password retrieved successfully for ID: ${id}`);
      return JSON.parse(passwordJSON) as EncryptedPassword;
    } catch (error) {
      console.error(`Error retrieving password for ID: ${id}`, error);
      return null;
    }
  }

  public static async storeEncryptedPassword(
    password: EncryptedPassword
  ): Promise<void> {
    try {
      console.log(`Storing encrypted password for ID: ${password.id}`);
      this.storeInStorageSync(
        `password-${password.id}`,
        JSON.stringify(password)
      );
      console.log(`Password stored successfully for ID: ${password.id}`);
    } catch (error) {
      console.error(`Error storing password for ID: ${password.id}`, error);
    }
  }

  public static async deleteEncryptedPassword(id: string): Promise<void> {
    try {
      console.log(`Deleting encrypted password for ID: ${id}`);
      this.deleteFromStorageSync(`password-${id}`);
      console.log(`Password deleted successfully for ID: ${id}`);
    } catch (error) {
      console.error(`Error deleting password for ID: ${id}`, error);
    }
  }

  public static async getExtensionSettings(): Promise<ExtensionSettings | null> {
    try {
      console.log("Retrieving extension settings.");
      const settingsJSON = this.getFromStorageSync("settings");
      if (!settingsJSON) {
        console.log("No extension settings found in storage.");
        return null;
      }
      console.log("Extension settings retrieved successfully.");
      return JSON.parse(settingsJSON) as ExtensionSettings;
    } catch (error) {
      console.error("Error retrieving extension settings:", error);
      return null;
    }
  }

  public static async storeExtensionSettings(
    settings: ExtensionSettings
  ): Promise<void> {
    this.storeInStorageSync("settings", JSON.stringify(settings));
  }

  private static deleteFromStorageSync(key: string): void {
    try {
      localStorage.removeItem(this.STORAGE_PREFIX + key);
    } catch (error) {
      console.error("Error deleting from storage:", error);
    }
  }

  public static clearStorage(): void {
    try {
      localStorage.clear();
    } catch (error) {
      console.error("Error clearing storage:", error);
    }
  }

  private static storeInStorageSync(key: string, value: string): void {
    try {
      localStorage.setItem(this.STORAGE_PREFIX + key, value);
    } catch (error) {
      console.error("Error storing in storage:", error);
    }
  }

  private static getFromStorageSync(key: string): string | null {
    try {
      return localStorage.getItem(this.STORAGE_PREFIX + key);
    } catch (error) {
      console.error("Error getting from storage:", error);
      return null;
    }
  }

  public static async getEncryptedPasswords(): Promise<EncryptedPassword[]> {
    try {
      console.log("Retrieving all encrypted passwords");
      const passwords: EncryptedPassword[] = [];

      // Iterate through localStorage to find password entries
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key?.startsWith(this.STORAGE_PREFIX + "password-")) {
          const passwordJSON = this.getFromStorageSync(
            key.replace(this.STORAGE_PREFIX, "")
          );
          if (passwordJSON) {
            passwords.push(JSON.parse(passwordJSON) as EncryptedPassword);
          }
        }
      }

      console.log(`Retrieved ${passwords.length} passwords successfully`);
      return passwords;
    } catch (error) {
      console.error("Error retrieving all passwords:", error);
      return [];
    }
  }
}

export default StoringService;
