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
 */ import { KeySet, EncryptedPassword, ExtensionSettings } from "./types";
import EncryptionService from "./Keys-managment/Encrypt";

class DatabaseService {
  private static readonly STORAGE_PREFIX = "password-manager-";
  private static readonly SESSION_DURATION = 30 * 24 * 60 * 60 * 1000; // 30 days

  public static async getKeysFromStorage(): Promise<KeySet | null> {
    const keysJSON = await this.getFromStorage("keys");
    if (!keysJSON) return null;
    const keys = JSON.parse(keysJSON) as KeySet;

    if (keys.lastRotated + this.SESSION_DURATION < Date.now()) {
      await this.deleteFromStorage("keys");
      return null;
    }

    return keys;
  }

  public static async storeKeys(keys: KeySet): Promise<void> {
    await this.storeInStorage("keys", JSON.stringify(keys));
  }

  public static async getEncryptedPassword(
    id: string
  ): Promise<EncryptedPassword | null> {
    const passwordJSON = await this.getFromStorage(`password-${id}`);
    return passwordJSON
      ? (JSON.parse(passwordJSON) as EncryptedPassword)
      : null;
  }

  public static async storeEncryptedPassword(
    password: EncryptedPassword
  ): Promise<void> {
    await this.storeInStorage(
      `password-${password.id}`,
      JSON.stringify(password)
    );
  }

  public static async deleteEncryptedPassword(id: string): Promise<void> {
    await this.deleteFromStorage(`password-${id}`);
  }

  public static async getExtensionSettings(): Promise<ExtensionSettings | null> {
    const settingsJSON = await this.getFromStorage("settings");
    return settingsJSON
      ? (JSON.parse(settingsJSON) as ExtensionSettings)
      : null;
  }

  public static async storeExtensionSettings(
    settings: ExtensionSettings
  ): Promise<void> {
    await this.storeInStorage("settings", JSON.stringify(settings));
  }

  private static async deleteFromStorage(key: string): Promise<void> {
    try {
      await localStorage.removeItem(this.STORAGE_PREFIX + key);
    } catch (error) {
      console.error("Error deleting from storage:", error);
    }
  }

  public static async clearStorage(): Promise<void> {
    try {
      await localStorage.clear();
    } catch (error) {
      console.error("Error clearing storage:", error);
    }
  }

  private static _offlineChanges: Array<{
    id: string;
    action: "create" | "update" | "delete";
    data: EncryptedPassword;
  }> = [];

  public static async queueOfflineChange(
    id: string,
    action: "create" | "update" | "delete",
    data: EncryptedPassword
  ): Promise<void> {
    this._offlineChanges.push({ id, action, data });
  }

  public static async syncOfflineChanges(): Promise<void> {
    for (const change of this._offlineChanges) {
      try {
        switch (change.action) {
          case "create":
          case "update":
            await this.storeEncryptedPassword(change.data);
            break;
          case "delete":
            await this.deleteEncryptedPassword(change.id);
            break;
        }
      } catch (error) {
        console.error(
          `Error syncing offline change (${change.action}) for ${change.id}:`,
          error
        );
      }
    }
    this._offlineChanges = [];
  }

  // Encrypt data before storing
  private static async storeInStorage(
    key: string,
    value: string
  ): Promise<void> {
    try {
      const keySet = await this.getKeysFromStorage();
      if (!keySet) throw new Error("KeySet not found");

      const encryptedValue = EncryptionService.encryptPassword(
        {
          encryptedData: { website: value, authToken: "", password: "" },
          iv: "",
          algorithm: "AES-GCM",
          keyId: keySet.id,
          id: "",
          createdAt: 0,
          modifiedAt: 0,
          lastAccessed: 0,
          version: 0,
          strength: "medium",
        },
        keySet
      ).encryptedData.website; // Use encryption here

      await localStorage.setItem(this.STORAGE_PREFIX + key, encryptedValue);
    } catch (error) {
      console.error("Error storing in storage:", error);
    }
  }

  // Decrypt data after retrieving
  private static async getFromStorage(key: string): Promise<string | null> {
    try {
      const encryptedValue = await localStorage.getItem(
        this.STORAGE_PREFIX + key
      );
      if (!encryptedValue) return null;

      const keySet = await this.getKeysFromStorage();
      if (!keySet) throw new Error("KeySet not found");

      const decryptedValue = EncryptionService.decryptPassword(
        {
          encryptedData: {
            website: encryptedValue,
            authToken: "",
            password: "",
          },
          iv: "",
          algorithm: "AES-GCM",
          keyId: keySet.id,
          id: "",
          createdAt: 0,
          modifiedAt: 0,
          lastAccessed: 0,
          version: 0,
          strength: "medium",
        },
        keySet
      ).encryptedData.website;

      return decryptedValue;
    } catch (error) {
      console.error("Error getting from storage:", error);
      return null;
    }
  }

  public static async rotateKeys(): Promise<void> {
    const newKeys = await EncryptionService.generateKeySet();
    await this.storeKeys(newKeys);
  }

  public static async clearSessionData(): Promise<void> {
    await this.deleteFromStorage("keys");
    await this.clearStorage();
  }

  private static async resolveConflict(
    id: string,
    newData: EncryptedPassword
  ): Promise<void> {
    const currentData = await this.getEncryptedPassword(id);
    if (!currentData || newData.modifiedAt > currentData.modifiedAt) {
      await this.storeEncryptedPassword(newData);
    }
  }

  private static _lastSyncTimestamp: number = 0;

  public static async getSyncStatus(): Promise<{
    offline: boolean;
    lastSync: number;
  }> {
    return {
      offline: this._offlineChanges.length > 0,
      lastSync: this._lastSyncTimestamp,
    };
  }

  public static async updateSyncTimestamp(): Promise<void> {
    this._lastSyncTimestamp = Date.now();
    await this.storeInStorage(
      "lastSyncTimestamp",
      String(this._lastSyncTimestamp)
    );
  }

  public static async getAllEncryptedPasswords(): Promise<EncryptedPassword[]> {
    const encryptedPasswords: EncryptedPassword[] = [];
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(this.STORAGE_PREFIX + "password-")) {
          const passwordJSON = await this.getFromStorage(
            key.replace(this.STORAGE_PREFIX, "")
          );
          if (passwordJSON) {
            encryptedPasswords.push(
              JSON.parse(passwordJSON) as EncryptedPassword
            );
          }
        }
      }
    } catch (error) {
      console.error("Error retrieving encrypted passwords:", error);
    }
    return encryptedPasswords;
  }
}

export default DatabaseService;
