import {
  NewEncryptedPassword,
  SymmetricKeys,
  EncryptionKeys,
  KeySet,
  AsymmetricKeys,
  LoginFormData,
} from "../types";
import { CryptoUtils } from "./CryptoUtils";
import DecryptService from "./Decrypt";
import AdditionalMethods from "./additionals";
import { v4 as uuidv4 } from "uuid"; // Importing UUID library

export class CredentialCryptoService {
  public static async encryptCredentials(
    credentials: {
      authToken: string;
      username: string;
      email: string;
      userId: string;
      password: string;
    },
    aesKey: SymmetricKeys
  ): Promise<{
    encryptedData: {
      authToken: string;
      username: string;
      email: string;
      userId: string;
      password: string;
    };
    formattedOutput: string;
  }> {


    const key = await CryptoUtils.importAESKey(aesKey.key);
    const iv = CryptoUtils.base64ToBuffer(aesKey.iv);

    const encryptField = async (field: string, value: string) => {
      const result = await CryptoUtils.encryptString(value, key, iv);
      return result;
    };

    const encryptedData = {
      authToken: await encryptField('authToken', credentials.authToken),
      userId: await encryptField('userId', credentials.userId),
      email:credentials.email,
      username:credentials.username,
      password: await encryptField('password', credentials.password),
    };

    const formattedOutput = [
      "----------encrypted username----------------",
      encryptedData.username,
      "----------encrypted userId----------------",
      encryptedData.userId,
      "----------encrypted password----------------",
      encryptedData.password,
      "----------encrypted email----------------",
      encryptedData.email,
      "----------encrypted authToken----------------",
      encryptedData.authToken,
    ].join("\n");

    return { encryptedData, formattedOutput };
  }

  public static async decryptCredentials(
    encryptedData: {
      authToken: string;
      email?: string;
      username?: string;
      userId: string;
      password: string;
    },
    aesKey: SymmetricKeys
  ): Promise<{
    authToken: string;
    email?: string;
    username?: string;
    userId: string;
    password: string;
  }> {
    try {

      const key = await CryptoUtils.importAESKey(aesKey.key);

      const iv = CryptoUtils.base64ToBuffer(aesKey.iv);

      
      const decryptField = async (field: string, value: string) => {
        try {
          if (!value) return '';
          
          const result = await DecryptService.decryptString(value, key, iv);
          return result;
        } catch (error) {
          console.error(`[decryptCredentials] Failed to decrypt ${field}:`, error);
          throw error;
        }
      };

      const decryptedData = {
        authToken: await decryptField('authToken', encryptedData.authToken),
        email: encryptedData.email,
        username: encryptedData.username,
        userId: await decryptField('userId', encryptedData.userId),
        password: await decryptField('password', encryptedData.password),
      };

      return decryptedData;
    } catch (error) {
      console.error("[decryptCredentials] Processing failed:", {
        error,
        errorName: error,
        errorMessage: error,
        stack: error
      });
      throw error;
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
        owner_email: password.owner_email,
        owner_id: password.owner_id,
        updated_at: password.updated_at,
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
