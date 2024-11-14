import {
  EncryptionKeys,
  SymmetricKeys,
  KeySet,
  AsymmetricKeys,
} from "../types";
import { v4 as uuidv4 } from "uuid";
import { CryptoUtils } from "./CryptoUtils";
import { CredentialCryptoService } from "./CredentialCrypto";
import AdditionalMethods from "./additionals";

export class KeyGenerationService {
  public static readonly SALT_LENGTH = 16;
  private static readonly IV_LENGTH = 12;
  private static readonly KEY_LENGTH = 32;
  public static readonly PBKDF2_ITERATIONS = 100000;
  static DEBUG: any;

  public static async generateKeyComponents(): Promise<{
    rsaKeyPair: AsymmetricKeys;
    aesKey: SymmetricKeys;
    formattedOutput: string;
  }> {
    const rsaKeyPair = await this.generateRSAKeyPair();
    const aesKey = await this.generateAESKey();

    const formattedOutput = CredentialCryptoService.formatKeyComponents(
      rsaKeyPair,
      aesKey
    );
    return { rsaKeyPair, aesKey, formattedOutput };
  }

  public static async generateKeySet(
    biometricType?: "fingerprint" | "faceid" | "other"
  ): Promise<EncryptionKeys> {
    const encryption = await this.generateRSAKeyPair();
    const dataKey = await this.generateAESKey();

    return {
      RSAkeys: encryption,
      AESKey: dataKey,
    };
  }

  private static async generateRSAKeyPair(): Promise<AsymmetricKeys> {
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
        key: CryptoUtils.bufferToBase64(publicKeyBuffer),
        algorithm: "RSA-OAEP",
        length: 4096,
        format: "spki",
      },
      privateKey: {
        key: CryptoUtils.bufferToBase64(privateKeyBuffer),
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
      key: CryptoUtils.bufferToBase64(keyBuffer),
      algorithm: "AES-GCM",
      length: 256,
      iv: CryptoUtils.bufferToBase64(iv as any),
    };
  }
  public async generateRSAKeys(): Promise<AsymmetricKeys> {
    const method = "generateRSAKeys";
    AdditionalMethods.logDebug(method, "Starting RSA key generation...");

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

      AdditionalMethods.logDebug(method, "RSA keys generated successfully", {
        publicKeyLength: publicKeyBuffer.byteLength,
        privateKeyLength: privateKeyBuffer.byteLength,
      });

      return {
        publicKey: {
          key: CryptoUtils.bufferToBase64(publicKeyBuffer),
          algorithm: "RSA-OAEP",
          length: 4096,
          format: "spki",
        },
        privateKey: {
          key: CryptoUtils.bufferToBase64(privateKeyBuffer),
          algorithm: "RSA-OAEP",
          length: 4096,
          format: "pkcs8",
          protected: true,
        },
      };
    } catch (error: any) {
      AdditionalMethods.logError(method, error);
      throw new Error(`Failed to generate RSA keys: ${error.message}`);
    }
  }
}
