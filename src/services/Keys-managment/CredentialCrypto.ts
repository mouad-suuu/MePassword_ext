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
    console.log("[encryptCredentials] Starting encryption:", {
      hasAuthToken: !!credentials?.authToken,
      hasEmail: !!credentials?.email,
      hasUsername: !!credentials?.username,
      hasUserId: !!credentials?.userId,
      hasPassword: !!credentials?.password
    });

    const key = await CryptoUtils.importAESKey(aesKey.key);
    const iv = CryptoUtils.base64ToBuffer(aesKey.iv);

    const encryptField = async (field: string, value: string, isToken: boolean = false) => {
      if (isToken) {
        console.log(`[encryptCredentials] Skipping encryption for ${field} as it's a token`);
        return value;
      }

      console.log(`[encryptCredentials] Encrypting ${field}:`, {
        inputLength: value?.length,
        inputPreview: value?.substring(0, 50)
      });
      const result = await CryptoUtils.encryptString(value, key, iv);
      console.log(`[encryptCredentials] Successfully encrypted ${field}:`, {
        outputLength: result?.length,
        outputPreview: result?.substring(0, 50)
      });
      return result;
    };

    const encryptedData = {
      // Pass true for authToken to skip encryption since it's already a JWT
      authToken: await encryptField('authToken', credentials.authToken, true),
      email: await encryptField('email', credentials.email),
      username: await encryptField('username', credentials.username),
      userId: await encryptField('userId', credentials.userId),
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

    console.log("[encryptCredentials] Successfully encrypted all credentials");
    return { encryptedData, formattedOutput };
  }

  public static async decryptCredentials(
    encryptedData: {
      authToken: string;
      email: string;
      username: string;
      userId: string;
      password: string;
    },
    aesKey: SymmetricKeys
  ): Promise<{
    authToken: string;
    email: string;
    username: string;
    userId: string;
    password: string;
  }> {
    try {
      console.log("[decryptCredentials] Starting credential decryption:", {
        hasAuthToken: !!encryptedData?.authToken,
        hasEmail: !!encryptedData?.email,
        hasUsername: !!encryptedData?.username,
        hasUserId: !!encryptedData?.userId,
        hasPassword: !!encryptedData?.password,
        hasAESKey: !!aesKey?.key,
        hasIV: !!aesKey?.iv
      });

      const key = await CryptoUtils.importAESKey(aesKey.key);
      console.log("[decryptCredentials] AES key imported:", {
        keyType: key?.type,
        keyAlgorithm: key?.algorithm,
        keyUsages: key?.usages
      });

      const iv = CryptoUtils.base64ToBuffer(aesKey.iv);
      console.log("[decryptCredentials] IV converted to buffer:", {
        ivLength: iv?.length,
        firstFewBytes: Array.from(iv?.slice(0, 4) || [])
      });

      console.log("[decryptCredentials] Starting individual field decryption");
      
      const decryptField = async (field: string, value: string) => {
        try {
          // Check if the value needs decryption
          const isEncrypted = CryptoUtils.isBase64Encrypted(value);
          console.log(`[decryptCredentials] Checking ${field}:`, {
            inputLength: value?.length,
            inputPreview: value?.substring(0, 50),
            isEncrypted
          });

          if (!isEncrypted) {
            console.log(`[decryptCredentials] ${field} is not encrypted, using as-is`);
            return value;
          }

          console.log(`[decryptCredentials] Decrypting ${field}`);
          const result = await this.decryptString(value, key, iv);
          console.log(`[decryptCredentials] Successfully decrypted ${field}:`, {
            outputLength: result?.length,
            outputPreview: result?.substring(0, 50)
          });
          return result;
        } catch (error) {
          console.error(`[decryptCredentials] Failed to process ${field}:`, {
            error,
            errorName: error,
            errorMessage: error
          });
          // If decryption fails, return the original value
          console.log(`[decryptCredentials] Returning original value for ${field}`);
          return value;
        }
      };

      const decryptedData = {
        authToken: encryptedData.authToken, // Always use raw token
        email: await decryptField('email', encryptedData.email),
        username: await decryptField('username', encryptedData.username),
        userId: await decryptField('userId', encryptedData.userId),
        password: await decryptField('password', encryptedData.password),
      };

      console.log("[decryptCredentials] Successfully processed all credentials");
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

    console.log("[DEBUG] Input password structure:", {
      website: password?.website ? "[PRESENT]" : "[MISSING]",
      user: password?.user ? "[PRESENT]" : "[MISSING]",
      password: password?.password ? "[PRESENT]" : "[MISSING]",
    });

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

      console.log("[DEBUG] Encrypted data structure:", {
        metadata,
        encryptedDataKeys: Object.keys(encryptedData),
        ivLength: keySet.IV.length,
      });

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
