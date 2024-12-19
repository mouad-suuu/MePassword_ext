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



  public static async getEncryptedCridentials_Keys(): Promise<KeySet | null> {
    try {
      const credentialsJSON =
        await StorageService.SecureStorage.getKeysFromStorage();

      if (credentialsJSON) {
        const credentials = credentialsJSON;
        return credentials;
      }

      return null;
    } catch (error) {
      console.error("Error retrieving credentials:", error);
      return null;
    }
  }
}
