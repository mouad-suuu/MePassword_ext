import { UserCredentials } from "../types";

import { KeySet } from "../types";
import { CryptoUtils } from "./CryptoUtils";

class DecryptService {
  public static async decryptPassword(
    encryptedPassword: KeySet,
    keySet: KeySet
  ): Promise<UserCredentials> {
    console.log("[DEBUG] Input encrypted password structure:", {
      metadata: {
        key: encryptedPassword?.AESKey,
        algorithm: "AES-GCM",
      },
      encryptedDataKeys: encryptedPassword?.Credentials
        ? Object.keys(encryptedPassword.Credentials)
        : [],
    });
    console.log("[DEBUG] Input keySet structure:", {
      dataKeyPresent: keySet?.AESKey ? true : false,
      ivPresent: keySet?.IV ? true : false,
    });

    console.log("Starting password decryption...");
    console.log("the data passed is:", encryptedPassword);
    try {
      if (!encryptedPassword || !keySet) {
        throw new Error("Invalid encryptedPassword or keySet provided");
      }

      const aesKey = await CryptoUtils.importAESKey(keySet.AESKey);
      const iv = CryptoUtils.base64ToBuffer(keySet.IV);
      if (!encryptedPassword.Credentials.server) {
        throw new Error("Encrypted website data is missing or invalid");
      }

      const decryptedData: UserCredentials = {
        server: await this.decryptString(
          encryptedPassword.Credentials.server,
          aesKey,
          iv
        ),
        authToken: await this.decryptString(
          encryptedPassword.Credentials.authToken,
          aesKey,
          iv
        ),
        password: await this.decryptString(
          encryptedPassword.Credentials.password || "",
          aesKey,
          iv
        ),
      };

      console.log("[DEBUG] Decrypted data structure:", {
        decryptedDataKeys: Object.keys(decryptedData),
      });

      console.log("Password decrypted successfully");
      return decryptedData;
    } catch (error: any) {
      console.error("Password decryption failed:", error);
      throw new Error(`Failed to decrypt password: ${error.message}`);
    }
  }
  public static async decryptString(
    encryptedData: string,
    key: CryptoKey,
    iv: Uint8Array
  ): Promise<string> {
    const decoder = new TextDecoder();
    const decryptedData = await window.crypto.subtle.decrypt(
      {
        name: "AES-GCM",
        iv,
      },
      key,
      CryptoUtils.base64ToBuffer(encryptedData)
    );
    return decoder.decode(decryptedData);
  }
}

export default DecryptService;
