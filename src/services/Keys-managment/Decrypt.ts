import { UserCredentials } from "../types";

import { KeySet } from "../types";
import { CryptoUtils } from "./CryptoUtils";

class DecryptService {
  public static async decryptPassword(
    encryptedPassword: KeySet,
    keySet: KeySet
  ): Promise<UserCredentials> {
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
