import { KeySet } from "../types";
import { LocalStorageManager } from "./LocalStorageManager";

export class CredentialStorage extends LocalStorageManager {
  public static async storeEncryptedCredentials(
    credentials: KeySet
  ): Promise<void> {
    try {
      this.storeInStorageSync("Credentials", JSON.stringify(credentials));
    } catch (error) {
      console.error(`Error storing Credentials`, error);
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

  public static async getEncryptedCridentials_Keys(): Promise<KeySet | null> {
    try {
      console.log("Retrieving encrypted credentials");
      const credentialsJSON = await this.getFromStorageSync("Keys");

      if (credentialsJSON) {
        const credentials = JSON.parse(credentialsJSON) as KeySet;
        console.log("Retrieved credentials successfully");
        return credentials;
      }

      return null;
    } catch (error) {
      console.error("Error retrieving credentials:", error);
      return null;
    }
  }
}
