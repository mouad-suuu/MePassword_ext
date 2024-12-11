import { KeySet, SessionSettings } from "../types";
import { SecureStorageService } from "./WindowsHelloStorage";

export class KeyStorage {
  /**
   * function to get the cridintials from the browser storage
   * export interface KeySet {
  privateKey: string;
  AESKey: string;
  IV: string;
  Credentials: UserCredentials;
}
  export interface UserCredentials {
  server: string;
  authToken: string;
  password?: string;
}
   */
  public static async getKeysFromStorage(): Promise<KeySet> {
    try {
      console.log("===========getting keys from windows storage=================");
      const keysJSON = await SecureStorageService.getKeysFromStorage();
      
      if (!keysJSON) {
        throw new Error("No keys found in storage");
      }

      return keysJSON as KeySet;
    } catch (error) {
      console.error("Error retrieving keys from storage:", error);
      throw error; // Propagate the error instead of returning empty object
    }
  }
  /**
   * function to post the cridintials from the browser storage
   */
  public static async storeKeys(keys: KeySet): Promise<void> {
    try {
      try {
        console.log(
          "===========Storing keysin windows storage================="
        );
        await SecureStorageService.storeKeys(keys);
      } catch (error) {
        console.error("===============Error storing keys=====================");
      }

      console.log("Storing keys in storage.");
      await SecureStorageService.storeKeys(keys);
      console.log("Keys stored successfully.");
    } catch (error) {
      console.error("Error storing keys:", error);
    }
  }

  public static async getSettingsFromStorage(): Promise<SessionSettings> {
    try {
      const settingsJSON = await SecureStorageService.getSettingsFromStorage();

      const settings = settingsJSON;
      return settings as SessionSettings;
    } catch (error) {
      console.error("Error retrieving settings from storage:", error);
      return {} as SessionSettings;
    }
  }
  /**
   * function to post the session settings from the browser storage
   */
  public static async storeSettings(settings: SessionSettings): Promise<void> {
    try {
      console.log("Storing settings in storage.");
      await SecureStorageService.storeSettings(settings);
      console.log("Settings stored successfully.");
    } catch (error) {
      console.error("Error storing settings:", error);
    }
  }
  /**
   * function to update the session settings from the browser storage
   */
  public static async updateSettings(
    newSettings: Partial<SessionSettings>
  ): Promise<void> {
    try {
      const currentSettings = await this.getSettingsFromStorage();
      const updatedSettings = { ...currentSettings, ...newSettings };
      await SecureStorageService.storeSettings(updatedSettings);
    } catch (error) {
      console.error("Error updating settings:", error);
    }
  }
}
