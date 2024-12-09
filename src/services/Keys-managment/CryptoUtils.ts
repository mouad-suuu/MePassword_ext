import { NewEncryptedPassword } from "../types";
import { KeyGenerationService } from "./KeyGeneration";

export class CryptoUtils {
  public static async deriveKey(password: string): Promise<CryptoKey> {
    const encoder = new TextEncoder();
    const salt = window.crypto.getRandomValues(
      new Uint8Array(KeyGenerationService.SALT_LENGTH)
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
        iterations: KeyGenerationService.PBKDF2_ITERATIONS,
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

  public static isBase64Encrypted(value: string): boolean {
    if (!value) return false;
    return this.isCredentialEncrypted(value) || this.isPasswordEncrypted(value);
  }

  public static isCredentialEncrypted(value: string): boolean {
    if (!value) return false;
    
    try {
      // Credentials are typically shorter and use standard base64
      const base64Regex = /^[A-Za-z0-9+/]*={0,2}$/;
      if (!base64Regex.test(value)) {
        return false;
      }

      // Try to decode it
      const decoded = atob(value);
      
      // Credentials typically have a higher ratio of non-printable characters
      const printableChars = decoded.replace(/[^\x20-\x7E]/g, '').length;
      const ratio = printableChars / decoded.length;
      
      // For credentials, we expect a lower ratio of printable characters
      return ratio < 0.3;
    } catch (error) {
      return false;
    }
  }

  public static isPasswordEncrypted(value: string): boolean {
    if (!value) return false;
    
    try {
      // First decode URI component if it's URL encoded
      const decodedValue = decodeURIComponent(value);
      
      // Passwords use URL-safe base64 characters
      const base64Regex = /^[A-Za-z0-9\-_/]*={0,2}$/;
      if (!base64Regex.test(decodedValue)) {
        return false;
      }

      // Convert URL-safe characters back to standard base64
      const standardBase64 = decodedValue.replace(/-/g, '+').replace(/_/g, '/');

      // Try to decode it
      const decoded = atob(standardBase64);
      
      // Password encryption typically has a different character distribution
      const printableChars = decoded.replace(/[^\x20-\x7E]/g, '').length;
      const ratio = printableChars / decoded.length;
      
      // For passwords, we can be more lenient with the ratio
      return ratio < 0.4;
    } catch (error) {
      // If URL decoding fails, try with raw value
      try {
        const decoded = atob(value);
        const printableChars = decoded.replace(/[^\x20-\x7E]/g, '').length;
        const ratio = printableChars / decoded.length;
        return ratio < 0.4;
      } catch {
        return false;
      }
    }
  }

  public static validatePin(pin: string): boolean {
    return /^\d{6}$/.test(pin);
  }

  public static async encryptString(
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

  public static async importRSAPublicKey(
    keyBase64: string
  ): Promise<CryptoKey> {
    const keyData = this.base64ToBuffer(keyBase64);
    return window.crypto.subtle.importKey(
      "spki",
      keyData,
      {
        name: "RSA-OAEP",
        hash: "SHA-256",
      },
      false,
      ["encrypt"]
    );
  }

  public static async importAESKey(keyBase64: string): Promise<CryptoKey> {
    const keyData = CryptoUtils.base64ToBuffer(keyBase64);
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

  public static async encryptWithRSA(
    data: {
      website: string;
      user: string;
      password: string;
    },
    publicKey: CryptoKey
  ): Promise<{ website: string; user: string; password: string }> {
    const encoder = new TextEncoder();

    // Encrypt each field separately
    const encryptedWebsite = await window.crypto.subtle.encrypt(
      { name: "RSA-OAEP" },
      publicKey,
      encoder.encode(data.website)
    );

    const encryptedUser = await window.crypto.subtle.encrypt(
      { name: "RSA-OAEP" },
      publicKey,
      encoder.encode(data.user)
    );

    const encryptedPassword = await window.crypto.subtle.encrypt(
      { name: "RSA-OAEP" },
      publicKey,
      encoder.encode(data.password)
    );

    return {
      website: this.bufferToBase64(encryptedWebsite),
      user: this.bufferToBase64(encryptedUser),
      password: this.bufferToBase64(encryptedPassword),
    };
  }

  public static bufferToBase64(buffer: ArrayBuffer): string {
    const bytes = new Uint8Array(buffer);
    const binary = bytes.reduce(
      (acc, byte) => acc + String.fromCharCode(byte),
      ""
    );
    return btoa(binary);
  }

  public static base64ToBuffer(base64: string): Uint8Array {
    try {
      const cleanBase64 = base64.trim().replace(/\s/g, "");
      const padded = (() => {
        const pad = cleanBase64.length % 4;
        return pad ? cleanBase64 + "=".repeat(4 - pad) : cleanBase64;
      })();

      if (!/^[A-Za-z0-9+/]*={0,2}$/.test(padded)) {
        throw new Error("Invalid base64 string format");
      }

      const binary = atob(padded);
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i);
      }

      return bytes;
    } catch (error) {
      console.error("Base64 decoding failed:", {
        error,
        inputLength: base64?.length,
        inputPreview: base64?.substring(0, 50),
      });
      throw new Error(`Base64 decoding failed: ${error}`);
    }
  }

  public static async importRSAPrivateKey(
    keyBase64: string
  ): Promise<CryptoKey> {
    try {
      console.log("Importing RSA private key", {
        keyBase64Preview: keyBase64.substring(0, 50),
      });

      if (!keyBase64 || !keyBase64.match(/^[A-Za-z0-9+/]*={0,2}$/)) {
        throw new Error("Invalid base64-encoded RSA private key");
      }

      const keyData = this.base64ToBuffer(keyBase64);
      const privateKey = await window.crypto.subtle.importKey(
        "pkcs8",
        keyData,
        { name: "RSA-OAEP", hash: "SHA-256" },
        false,
        ["decrypt"]
      );

      console.log("RSA private key imported successfully");
      return privateKey;
    } catch (error) {
      console.error("RSA private key import failed:", error);
      throw error;
    }
  }

  public static async decryptWithRSA(
    encryptedData: { website: string; user: string; password: string }[],
    privateKey: CryptoKey
  ): Promise<{ website: string; user: string; password: string }[]> {
    try {
      console.log("Starting RSA decryption process", {
        keyAlgorithm: privateKey.algorithm,
        keyUsages: privateKey.usages,
        dataLength: encryptedData?.length,
      });

      // Return empty array if no data is provided
      if (
        !encryptedData ||
        !Array.isArray(encryptedData) ||
        encryptedData.length === 0
      ) {
        console.log("No encrypted data to decrypt, returning empty array");
        return [];
      }

      const decoder = new TextDecoder("utf-8");
      const decryptedData = await Promise.all(
        encryptedData.map(async (item, index) => {
          try {
            console.log(`Decrypting item ${index}`, {
              websiteLength: item.website?.length,
              userLength: item.user?.length,
              passwordLength: item.password?.length,
              websitePreview: item.website?.substring(0, 50),
              userPreview: item.user?.substring(0, 50),
              passwordPreview: item.password?.substring(0, 50),
            });

            const websiteBuffer = await window.crypto.subtle.decrypt(
              { name: "RSA-OAEP" },
              privateKey,
              this.base64ToBuffer(item.website)
            );
            const userBuffer = await window.crypto.subtle.decrypt(
              { name: "RSA-OAEP" },
              privateKey,
              this.base64ToBuffer(item.user)
            );
            const passwordBuffer = await window.crypto.subtle.decrypt(
              { name: "RSA-OAEP" },
              privateKey,
              this.base64ToBuffer(item.password)
            );

            console.log(`Successfully decrypted item ${index}`);
            console.log(
              "RSA decryption process completed successfully",
              decoder.decode(websiteBuffer),
              decoder.decode(userBuffer),
              decoder.decode(passwordBuffer)
            );
            return {
              website: decoder.decode(websiteBuffer),
              user: decoder.decode(userBuffer),
              password: decoder.decode(passwordBuffer),
            };
          } catch (error) {
            console.error(`Error decrypting item ${index}:`, error);
            return null;
          }
        })
      );

      const validDecryptedData = decryptedData.filter((item) => item !== null);

      if (validDecryptedData.length === 0) {
        throw new Error("All decryption attempts failed");
      }

      return validDecryptedData;
    } catch (error) {
      console.error("RSA decryption error:", {
        name: error,
        message: error,
        stack: error,
      });
      throw error;
    }
  }
}
