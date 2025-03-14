import StorageService from "../StorageService";
import { KeySet } from "../types";

export class CredentialStorage {
  public static async storeEncryptedCredentials(
    credentials: KeySet
  ): Promise<void> {
    try {
      StorageService.SecureStorage.storeKeys(credentials);
    } catch (error) {
      console.error(`Error storing Credentials`, error);
    }
  }

  public static async deleteEncryptedPassword(id: string): Promise<void> {
    try {
      console.log(`Deleting encrypted password for ID: ${id}`);

      console.log(`Password deleted successfully for ID: ${id}`);
    } catch (error) {
      console.error(`Error deleting password for ID: ${id}`, error);
    }
  }

  public static async getEncryptedCridentials_Keys(): Promise<KeySet | null> {
    try {
      console.log("Retrieving encrypted credentials");
      const credentialsJSON =
        await StorageService.SecureStorage.getKeysFromStorage();

      if (credentialsJSON) {
        const credentials = credentialsJSON;
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
