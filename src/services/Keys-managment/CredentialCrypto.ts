import {
  NewEncryptedPassword,
  SymmetricKeys,
  EncryptionKeys,
  KeySet,
  AsymmetricKeys,
  LoginFormData,
} from "../types";
import { CryptoUtils } from "./CryptoUtils";
import AdditionalMethods from "./additionals";
import { v4 as uuidv4 } from "uuid"; // Importing UUID library

export class CredentialCryptoService {
  public static async encryptCredentials(
    credentials: {
      server: string;
      authToken: string;
      password?: string;
    },
    aesKey: SymmetricKeys
  ): Promise<{
    encryptedData: {
      server: string;
      authToken: string;
      password?: string;
    };
    formattedOutput: string;
  }> {
    const key = await CryptoUtils.importAESKey(aesKey.key);
    const iv = CryptoUtils.base64ToBuffer(aesKey.iv);

    const encryptedData = {
      server: await CryptoUtils.encryptString(credentials.server, key, iv),
      authToken: await CryptoUtils.encryptString(
        credentials.authToken,
        key,
        iv
      ),
      password: credentials.password
        ? await CryptoUtils.encryptString(credentials.password, key, iv)
        : undefined,
    };

    const formattedOutput = [
      "----------encrypted website----------------",
      encryptedData.server,
      "----------encrypted authkey----------------",
      encryptedData.authToken,
      credentials.password
        ? "----------encrypted password----------------\n" +
          encryptedData.password
        : "",
    ].join("\n");

    return { encryptedData, formattedOutput };
  }

  public static async decryptCredentials(
    encryptedData: {
      server: string;
      authToken: string;
      password?: string;
    },
    aesKey: SymmetricKeys
  ): Promise<{
    server: string;
    authToken: string;
    password?: string;
  }> {
    try {
      const key = await CryptoUtils.importAESKey(aesKey.key);
      const iv = CryptoUtils.base64ToBuffer(aesKey.iv);

      return {
        server: await this.decryptString(encryptedData.server, key, iv),
        authToken: await this.decryptString(encryptedData.authToken, key, iv),
        password: encryptedData.password
          ? await this.decryptString(encryptedData.password, key, iv)
          : undefined,
      };
    } catch (error) {
      console.error("Decryption failed:", error);
      throw new Error("Failed to decrypt credentials.");
    }
  }

  public static async encryptPassword(
    password: NewEncryptedPassword,
    keySet: KeySet
  ): Promise<NewEncryptedPassword> {
    const method = "encryptPassword";

    try {
      if (!password?.website || !password?.user || !password?.password) {
        throw new Error("Missing required password credentials");
      }

      const aesKey = await CryptoUtils.importAESKey(keySet.AESKey);
      const iv = CryptoUtils.base64ToBuffer(keySet.IV);

      const encryptedData: NewEncryptedPassword = {
        id: uuidv4(),
        website: await CryptoUtils.encryptString(password.website, aesKey, iv),
        user: password.user,
        password: await CryptoUtils.encryptString(
          password.password,
          aesKey,
          iv
        ),
      };

      const metadata: LoginFormData = {
        url: "test",
        title: "test",
        timestamp: "test",
      };

      return {
        ...encryptedData,
        formData: metadata,
      };
    } catch (error: any) {
      AdditionalMethods.logError(method, error);
      throw new Error(`Failed to encrypt password: ${error.message}`);
    }
  }

  public static formatKeyComponents(
    rsaKeys: AsymmetricKeys,
    aesKey: SymmetricKeys
  ): string {
    return [
      "----------public key----------------",
      rsaKeys.publicKey.key,
      "----------private key----------------",
      rsaKeys.privateKey.key,
      "----------aes-key----------------",
      aesKey.key,
      "----------aes-iv----------------",
      aesKey.iv,
    ].join("\n");
  }

  private static async decryptString(
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
