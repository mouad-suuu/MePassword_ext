/**
 * TODO:
 * this file will manage the encryption and decryption of the data.
 * we start with the creation of the account geven the website and the auth key
 * then we create the keys and store them in the local storage and give them to the user
 * we send the asymmetric keys to the server to be stored in the database so the user have ones and the server have the other and bouth needed to decrypt the data, exept the keys that will be used to decrypte the website and the auth key (those will be stored in the database for the session time and by the user)
 * we need a function to decrypte the website and the auth key, then we get the data from the database and decrypt them with the symmetric keys
 * we will use the src/services/db.ts to manage the database and the local storage and use src\services\Keys-managment\SessionManager.ts to manage the session of the user
 *  * Encryption Service
 * TODO: Implement the following functionalities:
 * 1. Key Generation:
 *    - Generate RSA 4096-bit keypairs
 *    - Generate AES-256-GCM keys
 *    - Handle PBKDF2 key derivation
 *
 * 2. Encryption Operations:
 *    - Encrypt/decrypt passwords
 *    - Handle website data encryption
 *    - Manage authentication tokens
 *    - Implement zero-knowledge proofs
 *
 * 3. Key Exchange:
 *    - Secure key transmission
 *    - Key backup encryption
 *    - Organization key sharing
 *
 * 4. Security Measures:
 *    - Implement constant-time operations
 *    - Handle secure random generation
 *    - Protect against timing attacks
 */ import { v4 as uuidv4 } from "uuid";
import {
  KeySet,
  SymmetricKeys,
  EncryptedPassword,
  EncryptionKeys,
  PasswordMetadata,
  UserCredentials,
} from "../types";

// Add new interfaces after existing imports
interface APICredentials {
  website: string;
  authToken: string;
  password: string;
}

interface APISettingsPayload {
  publicKey: string;
  password: string | undefined;
  deviceId: string;
  timestamp: number;
}

class EncryptionService {
  private static readonly SALT_LENGTH = 16;
  private static readonly IV_LENGTH = 12;
  private static readonly KEY_LENGTH = 32;
  private static readonly PBKDF2_ITERATIONS = 100000;
  private static readonly DEBUG = true;
  private static logDebug(method: string, message: string, data?: any) {
    if (this.DEBUG) {
      console.log(`[EncryptionService:${method}] ${message}`, data || "");
    }
  }

  // Add session storage property
  private static sessionData = new Map<string, any>();

  public static async generateKeyComponents(): Promise<{
    rsaKeyPair: EncryptionKeys;
    aesKey: SymmetricKeys;
    formattedOutput: string;
  }> {
    const method = "generateKeyComponents";
    this.logDebug(method, "Starting key component generation...");

    try {
      // Generate RSA key pair
      const rsaKeyPair = await this.generateRSAKeyPair();

      // Generate AES key
      const aesKey = await this.generateAESKey();

      // Format the output in the requested structure
      const formattedOutput = this.formatKeyComponents(rsaKeyPair, aesKey);

      return { rsaKeyPair, aesKey, formattedOutput };
    } catch (error: any) {
      throw new Error(`Failed to generate key components: ${error.message}`);
    }
  }

  private static async generateRSAKeyPair(): Promise<EncryptionKeys> {
    if (!window.crypto || !window.crypto.subtle) {
      throw new Error("WebCrypto API is not available");
    }

    const keyPair = await window.crypto.subtle.generateKey(
      {
        name: "RSA-OAEP",
        modulusLength: 4096,
        publicExponent: new Uint8Array([1, 0, 1]),
        hash: "SHA-256",
      },
      true,
      ["encrypt", "decrypt"]
    );

    const publicKeyBuffer = await window.crypto.subtle.exportKey(
      "spki",
      keyPair.publicKey
    );
    const privateKeyBuffer = await window.crypto.subtle.exportKey(
      "pkcs8",
      keyPair.privateKey
    );

    return {
      publicKey: {
        key: this.bufferToBase64(publicKeyBuffer),
        algorithm: "RSA-OAEP",
        length: 4096,
        format: "spki",
      },
      privateKey: {
        key: this.bufferToBase64(privateKeyBuffer),
        algorithm: "RSA-OAEP",
        length: 4096,
        format: "pkcs8",
        protected: true,
      },
    };
  }

  private static async generateAESKey(): Promise<SymmetricKeys> {
    if (!window.crypto || !window.crypto.subtle) {
      throw new Error("WebCrypto API is not available");
    }

    const iv = window.crypto.getRandomValues(new Uint8Array(this.IV_LENGTH));
    const key = await window.crypto.subtle.generateKey(
      {
        name: "AES-GCM",
        length: 256,
      },
      true,
      ["encrypt", "decrypt"]
    );

    const keyBuffer = await window.crypto.subtle.exportKey("raw", key);

    return {
      key: this.bufferToBase64(keyBuffer),
      algorithm: "AES-GCM",
      length: 256,
      iv: this.bufferToBase64(iv as any),
    };
  }

  private static formatKeyComponents(
    rsaKeys: EncryptionKeys,
    aesKey: SymmetricKeys
  ): string {
    return [
      "----------publickey----------------",
      rsaKeys.publicKey.key,
      "----------privatekey----------------",
      rsaKeys.privateKey.key,
      "----------aes-key----------------",
      aesKey.key,
      "----------aes-iv----------------",
      aesKey.iv,
    ].join("\n");
  }

  public static async encryptCredentials(
    credentials: {
      website: string;
      authToken: string;
      password?: string;
    },
    aesKey: SymmetricKeys
  ): Promise<{
    encryptedData: {
      website: string;
      authToken: string;
      password?: string;
    };
    formattedOutput: string;
  }> {
    const key = await this.importAESKey(aesKey.key);
    const iv = this.base64ToBuffer(aesKey.iv);

    const encryptedData = {
      website: await this.encryptString(credentials.website, key, iv),
      authToken: await this.encryptString(credentials.authToken, key, iv),
      password: credentials.password
        ? await this.encryptString(credentials.password, key, iv)
        : undefined,
    };

    const formattedOutput = [
      "----------encrypted website----------------",
      encryptedData.website,
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
      website: string;
      authToken: string;
      password?: string;
    },
    aesKey: SymmetricKeys
  ): Promise<{
    website: string;
    authToken: string;
    password?: string;
  }> {
    const key = await this.importAESKey(aesKey.key);
    const iv = this.base64ToBuffer(aesKey.iv);

    return {
      website: await this.decryptString(encryptedData.website, key, iv),
      authToken: await this.decryptString(encryptedData.authToken, key, iv),
      password: encryptedData.password
        ? await this.decryptString(encryptedData.password, key, iv)
        : undefined,
    };
  }

  // Existing utility methods remain the same
  private static async encryptString(
    data: string,
    key: CryptoKey,
    iv: Uint8Array
  ): Promise<string> {
    const encoder = new TextEncoder();
    const encryptedData = await window.crypto.subtle.encrypt(
      {
        name: "AES-GCM",
        iv,
      },
      key,
      encoder.encode(data)
    );
    return this.bufferToBase64(encryptedData);
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
      this.base64ToBuffer(encryptedData)
    );
    return decoder.decode(decryptedData);
  }

  private static async importAESKey(keyBase64: string): Promise<CryptoKey> {
    const keyData = this.base64ToBuffer(keyBase64);
    return window.crypto.subtle.importKey(
      "raw",
      keyData,
      {
        name: "AES-GCM",
        length: 256,
      },
      false,
      ["encrypt", "decrypt"]
    );
  }

  private static bufferToBase64(buffer: ArrayBuffer): string {
    const bytes = new Uint8Array(buffer);
    const binary = bytes.reduce(
      (acc, byte) => acc + String.fromCharCode(byte),
      ""
    );
    return btoa(binary);
  }

  private static base64ToBuffer(base64: string): Uint8Array {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes;
  }

  private static logError(method: string, error: any) {
    console.error(`[EncryptionService:${method}] Error:`, {
      message: error.message,
      stack: error.stack,
      details: error,
    });
  }

  public async generateRSAKeys(): Promise<EncryptionKeys> {
    const method = "generateRSAKeys";
    EncryptionService.logDebug(method, "Starting RSA key generation...");

    try {
      // Validate WebCrypto API availability
      if (!window.crypto || !window.crypto.subtle) {
        throw new Error("WebCrypto API is not available in this environment");
      }

      const keyPair = await window.crypto.subtle.generateKey(
        {
          name: "RSA-OAEP",
          modulusLength: 4096,
          publicExponent: new Uint8Array([1, 0, 1]),
          hash: "SHA-256",
        },
        true,
        ["encrypt", "decrypt"]
      );
      console.log("RSA key pair generated successfully");

      const publicKeyBuffer = await window.crypto.subtle.exportKey(
        "spki",
        keyPair.publicKey
      );
      const privateKeyBuffer = await window.crypto.subtle.exportKey(
        "pkcs8",
        keyPair.privateKey
      );

      EncryptionService.logDebug(method, "RSA keys generated successfully", {
        publicKeyLength: publicKeyBuffer.byteLength,
        privateKeyLength: privateKeyBuffer.byteLength,
      });

      return {
        publicKey: {
          key: EncryptionService.bufferToBase64(publicKeyBuffer),
          algorithm: "RSA-OAEP",
          length: 4096,
          format: "spki",
        },
        privateKey: {
          key: EncryptionService.bufferToBase64(privateKeyBuffer),
          algorithm: "RSA-OAEP",
          length: 4096,
          format: "pkcs8",
          protected: true,
        },
      };
    } catch (error: any) {
      EncryptionService.logError(method, error);
      throw new Error(`Failed to generate RSA keys: ${error.message}`);
    }
  }

  public static async generateKeySet(
    biometricType?: "fingerprint" | "faceid" | "other"
  ): Promise<KeySet> {
    const encryptionService = new EncryptionService();
    const encryption = await encryptionService.generateRSAKeys();
    const dataKey = await EncryptionService.generateAESKey();

    const biometric = biometricType
      ? {
          key: this.bufferToBase64(
            window.crypto.getRandomValues(new Uint8Array(32)).buffer
          ),
          type: biometricType,
          verified: false,
        }
      : undefined;

    return {
      id: uuidv4(),
      version: 1,
      created: Date.now(),
      lastRotated: Date.now(),
      encryption,
      dataKey,
      biometric,
    };
  }

  public static async encryptPassword(
    password: UserCredentials,
    keySet: KeySet
  ): Promise<EncryptedPassword> {
    const method = "encryptPassword";

    console.log("[DEBUG] Input password structure:", {
      website: password?.website ? "[PRESENT]" : "[MISSING]",
      authToken: password?.authToken ? "[PRESENT]" : "[MISSING]",
      password: password?.password ? "[PRESENT]" : "[MISSING]",
      notes: password?.notes ? "[PRESENT]" : "[MISSING]",
    });
    console.log("[DEBUG] Input keySet structure:", {
      id: keySet?.id,
      dataKeyPresent: keySet?.dataKey?.key ? true : false,
      ivPresent: keySet?.dataKey?.iv ? true : false,
    });

    try {
      // Input validation
      if (!password?.website || !password?.authToken || !password?.password) {
        throw new Error("Missing required password credentials");
      }

      if (!keySet?.dataKey?.key || !keySet?.dataKey?.iv) {
        throw new Error("Invalid keySet structure");
      }

      const aesKey = await this.importAESKey(keySet.dataKey.key);
      const iv = this.base64ToBuffer(keySet.dataKey.iv);

      const encryptedData: any = {
        website: await this.encryptString(password.website, aesKey, iv),
        authToken: await this.encryptString(password.authToken, aesKey, iv),
        password: await this.encryptString(password.password, aesKey, iv),
        notes: password.notes
          ? await this.encryptString(password.notes, aesKey, iv)
          : undefined,
      };

      const metadata: PasswordMetadata = {
        id: uuidv4(),
        createdAt: Date.now(),
        modifiedAt: Date.now(),
        lastAccessed: Date.now(),
        version: 1,
        strength: "medium",
      };

      console.log("[DEBUG] Encrypted data structure:", {
        metadata,
        encryptedDataKeys: Object.keys(encryptedData),
        keyId: keySet.id,
        ivLength: keySet.dataKey.iv.length,
        algorithm: keySet.dataKey.algorithm,
      });

      this.logDebug(method, "Password encrypted successfully", {
        keySetId: keySet.id,
        encryptedDataSize: JSON.stringify(encryptedData).length,
      });

      return {
        ...metadata,
        encryptedData,
        keyId: keySet.id,
        iv: keySet.dataKey.iv,
        algorithm: keySet.dataKey.algorithm,
      };
    } catch (error: any) {
      this.logError(method, error);
      throw new Error(`Failed to encrypt password: ${error.message}`);
    }
  }

  public static async decryptPassword(
    encryptedPassword: EncryptedPassword,
    keySet: KeySet
  ): Promise<EncryptedPassword> {
    console.log("[DEBUG] Input encrypted password structure:", {
      metadata: {
        id: encryptedPassword?.id,
        keyId: encryptedPassword?.keyId,
        algorithm: encryptedPassword?.algorithm,
      },
      encryptedDataKeys: encryptedPassword?.encryptedData
        ? Object.keys(encryptedPassword.encryptedData)
        : [],
    });
    console.log("[DEBUG] Input keySet structure:", {
      id: keySet?.id,
      dataKeyPresent: keySet?.dataKey?.key ? true : false,
      ivPresent: keySet?.dataKey?.iv ? true : false,
    });

    console.log("Starting password decryption...");
    console.log("the data passed is:", encryptedPassword);
    try {
      if (!encryptedPassword || !keySet) {
        throw new Error("Invalid encryptedPassword or keySet provided");
      }

      const aesKey = await this.importAESKey(keySet.dataKey.key);
      const iv = this.base64ToBuffer(keySet.dataKey.iv);
      if (!encryptedPassword.encryptedData.website) {
        throw new Error("Encrypted website data is missing or invalid");
      }

      const decryptedData: any = {
        website: await this.decryptString(
          encryptedPassword.encryptedData.website,
          aesKey,
          iv
        ),
        authToken: await this.decryptString(
          encryptedPassword.encryptedData.authToken,
          aesKey,
          iv
        ),
        password: await this.decryptString(
          encryptedPassword.encryptedData.password,
          aesKey,
          iv
        ),
        notes: encryptedPassword.encryptedData.notes
          ? await this.decryptString(
              encryptedPassword.encryptedData.notes,
              aesKey,
              iv
            )
          : undefined,
      };

      console.log("[DEBUG] Decrypted data structure:", {
        decryptedDataKeys: Object.keys(decryptedData),
        keyId: keySet.id,
      });

      console.log("Password decrypted successfully");
      return {
        ...encryptedPassword,
        encryptedData: decryptedData,
        keyId: keySet.id,
      };
    } catch (error: any) {
      console.error("Password decryption failed:", error);
      throw new Error(`Failed to decrypt password: ${error.message}`);
    }
  }

  public static async generateZKP(
    message: string,
    privateKeyBase64: string
  ): Promise<{ proof: string; publicKey: string }> {
    const privateKey = await this.importRSAPrivateKey(privateKeyBase64);
    const encoder = new TextEncoder();
    const data = encoder.encode(message);

    const signature = await window.crypto.subtle.sign(
      {
        name: "RSA-PSS",
        saltLength: 32,
      },
      privateKey,
      data
    );

    return {
      proof: this.bufferToBase64(signature),
      publicKey: privateKeyBase64, // In a real ZKP system, you'd derive a public key
    };
  }

  public static async verifyZKP(
    message: string,
    proofBase64: string,
    publicKeyBase64: string
  ): Promise<boolean> {
    try {
      const publicKey = await this.importRSAPublicKey(publicKeyBase64);
      const proof = this.base64ToBuffer(proofBase64);
      const encoder = new TextEncoder();
      const data = encoder.encode(message);

      return await window.crypto.subtle.verify(
        {
          name: "RSA-PSS",
          saltLength: 32,
        },
        publicKey,
        proof,
        data
      );
    } catch (error) {
      console.error("ZKP verification failed:", error);
      return false;
    }
  }

  public static async deriveKey(password: string): Promise<CryptoKey> {
    const encoder = new TextEncoder();
    const salt = window.crypto.getRandomValues(
      new Uint8Array(this.SALT_LENGTH)
    );

    const baseKey = await window.crypto.subtle.importKey(
      "raw",
      encoder.encode(password),
      "PBKDF2",
      false,
      ["deriveBits", "deriveKey"]
    );

    return window.crypto.subtle.deriveKey(
      {
        name: "PBKDF2",
        salt,
        iterations: this.PBKDF2_ITERATIONS,
        hash: "SHA-256",
      },
      baseKey,
      {
        name: "AES-GCM",
        length: 256,
      },
      true,
      ["encrypt", "decrypt"]
    );
  }

  private static async importRSAPublicKey(
    keyBase64: string
  ): Promise<CryptoKey> {
    const keyData = this.base64ToBuffer(keyBase64);
    return window.crypto.subtle.importKey(
      "spki",
      keyData,
      {
        name: "RSA-PSS",
        hash: "SHA-256",
      },
      false,
      ["verify"]
    );
  }

  private static async importRSAPrivateKey(
    keyBase64: string
  ): Promise<CryptoKey> {
    const keyData = this.base64ToBuffer(keyBase64);
    return window.crypto.subtle.importKey(
      "pkcs8",
      keyData,
      {
        name: "RSA-PSS",
        hash: "SHA-256",
      },
      false,
      ["sign"]
    );
  }

  /**
   * Prepares and sends API settings with decrypted credentials
   */
  public static async prepareAndSendAPISettings(
    encryptedCredentials: {
      website: string;
      authToken: string;
      password: string | undefined;
    },
    aesKey: SymmetricKeys,
    rsaPublicKey: string
  ): Promise<Response> {
    try {
      const decryptedCredentials = await this.decryptCredentials(
        encryptedCredentials,
        aesKey
      );

      const apiPayload: APISettingsPayload = {
        publicKey: rsaPublicKey,
        password: decryptedCredentials.password,
        deviceId: uuidv4(),
        timestamp: Date.now(),
      };

      return await this.sendToAPI(
        apiPayload,
        decryptedCredentials.website,
        decryptedCredentials.authToken
      );
    } catch (error: any) {
      throw new Error(
        `Failed to prepare and send API settings: ${error.message}`
      );
    }
  }

  /**
   * Sends the settings payload to the API
   * we need to decrypt the credentials and then use them to send the request ({decrypted website}/api/settings)
   */
  private static async sendToAPI(
    payload: APISettingsPayload,
    website: string,
    authToken: string
  ): Promise<Response> {
    try {
      console.log("website:", website);
      console.log("authToken:", authToken);
      const response = await fetch(`${website}/api/settings`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(`API request failed: ${response.statusText}`);
      }

      return response;
    } catch (error: any) {
      throw new Error(`API request failed: ${error.message}`);
    }
  }

  /**
   * Session management methods
   */
  public static generateSessionKey(): string {
    return uuidv4();
  }

  public static storeSessionData(
    sessionKey: string,
    data: any,
    expirationMs: number = 1800000
  ): void {
    this.sessionData.set(sessionKey, {
      data,
      expiration: Date.now() + expirationMs,
    });

    setTimeout(() => {
      this.sessionData.delete(sessionKey);
    }, expirationMs);
  }

  public static getSessionData(sessionKey: string): any {
    const entry = this.sessionData.get(sessionKey);

    if (!entry) {
      return null;
    }

    if (Date.now() > entry.expiration) {
      this.sessionData.delete(sessionKey);
      return null;
    }

    return entry.data;
  }

  public static clearSessionData(sessionKey: string): void {
    this.sessionData.delete(sessionKey);
  }

  /**
   * Validates PIN format
   */
  public static validatePin(pin: string): boolean {
    return /^\d{6}$/.test(pin);
  }
}

export default EncryptionService;
