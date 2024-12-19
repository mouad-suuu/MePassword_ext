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
      if (!encryptedPassword.Credentials.authToken) {
        throw new Error("Encrypted website data is missing or invalid");
      }

      const decryptedData: UserCredentials = {
        authToken: await this.decryptString(
          encryptedPassword.Credentials.authToken,
          aesKey,
          iv
        ),
        username: await this.decryptString(
          encryptedPassword.Credentials.username,
          aesKey,
          iv
        ),
        password: await this.decryptString(
          encryptedPassword.Credentials.password,
          aesKey,
          iv
        ),
        email: encryptedPassword.Credentials.email
          ? await this.decryptString(
              encryptedPassword.Credentials.email,
              aesKey,
              iv
            )
          : "",
        userId: encryptedPassword.Credentials.userId
          ? await this.decryptString(
              encryptedPassword.Credentials.userId,
              aesKey,
              iv
            )
          : "",
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
