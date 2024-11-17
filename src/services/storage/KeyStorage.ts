import { KeySet, SessionSettings } from "../types";
import { LocalStorageManager } from "./LocalStorageManager";

export class KeyStorage extends LocalStorageManager {
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
  /**
   * function to post the cridintials from the browser storage
   */
  public static async storeKeys(keys: KeySet): Promise<void> {
    try {
      console.log("Storing keys in storage.");
      await this.storeInStorageSync("keys", JSON.stringify(keys));
      console.log("Keys stored successfully.");
    } catch (error) {
      console.error("Error storing keys:", error);
    }
  }
  /**
   * function to get the session settings from the browser storage
   * export interface SessionSettings {
  pushNotifications: boolean; // Toggle notifications
  autoLockTime: number; // Time in ms or mins before auto-lock
  autoLockStart: number; // Timestamp of last auto-lock
  sessionStart: number; // Timestamp when session started
  sessionTime: number; // Total session time allowed before logout
  sessionExpiry?: number; // Timestamp for scheduled session expiration
  lastAccessTime?: number; // Timestamp of last session access (for inactivity checks)
  biometricVerification: boolean; // Use biometrics for verification
  biometricType: "face" | "fingerprint" | "none"; // Supported biometric types
  biometricPassword?: string; // Fallback password if biometrics fail
  lockOnLeave?: boolean; // Auto-lock on window blur/focus loss
}
   */
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
  /**
   * function to post the session settings from the browser storage
   */
  public static async storeSettings(settings: SessionSettings): Promise<void> {
    try {
      console.log("Storing settings in storage.");
      await this.storeInStorageSync("settings", JSON.stringify(settings));
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
      await this.storeSettings(updatedSettings);
    } catch (error) {
      console.error("Error updating settings:", error);
    }
  }
}
