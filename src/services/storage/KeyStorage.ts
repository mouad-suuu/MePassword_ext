import { KeySet, SessionSettings } from "../types";
import { LocalStorageManager } from "./LocalStorageManager";

export class KeyStorage extends LocalStorageManager {
  private static readonly SESSION_DURATION = 30 * 24 * 60 * 60 * 1000; // 30 days

  public static async getKeysFromStorage(): Promise<KeySet> {
    try {
      const keysJSON = await this.getFromStorageSync("keys");
      if (!keysJSON) {
        console.log("No keys found in storage.");
        return {} as KeySet;
      }
      const keys = JSON.parse(keysJSON) as KeySet;
      return keys;
    } catch (error) {
      console.error("Error retrieving keys from storage:", error);
      return {} as KeySet;
    }
  }

  public static async storeKeys(keys: KeySet): Promise<void> {
    try {
      console.log("Storing keys in storage.");
      await this.storeInStorageSync("keys", JSON.stringify(keys));
      console.log("Keys stored successfully.");
    } catch (error) {
      console.error("Error storing keys:", error);
    }
  }

  public static async getSettingsFromStorage(): Promise<SessionSettings> {
    try {
      const settingsJSON = await this.getFromStorageSync("settings");
      if (!settingsJSON) {
        console.log("No settings found in storage.");
        return {} as SessionSettings;
      }
      const settings = JSON.parse(settingsJSON) as SessionSettings;
      return settings;
    } catch (error) {
      console.error("Error retrieving settings from storage:", error);
      return {} as SessionSettings;
    }
  }

  public static async storeSettings(settings: SessionSettings): Promise<void> {
    try {
      console.log("Storing settings in storage.");
      await this.storeInStorageSync("settings", JSON.stringify(settings));
      console.log("Settings stored successfully.");
    } catch (error) {
      console.error("Error storing settings:", error);
    }
  }
}
