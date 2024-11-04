import type { KeySet, SymmetricKeys } from "../types";

class Encrypt {
  private keySet: KeySet | null = null;
  private readonly storagePrefix = "secure_pwd_mgr_";

  /**
   * Verifies if the browser environment supports all required cryptographic capabilities.
   * Checks for secure context, Web Crypto API, and localStorage availability.
   * @throws Error if any required capability is missing or storage access is denied
   */
  private async checkBrowserCapabilities(): Promise<void> {
    // Check if running in a secure context
    if (!window.isSecureContext) {
      throw new Error("Application must run in a secure context (HTTPS)");
    }

    // Check for required Web Crypto API support
    if (!window.crypto || !window.crypto.subtle) {
      throw new Error("Web Crypto API is not supported in this environment");
    }

    // Check for required storage APIs
    if (!window.localStorage) {
      throw new Error("Local storage is not available");
    }

    try {
      // Test storage access
      const testKey = `${this.storagePrefix}test`;
      localStorage.setItem(testKey, "test");
      localStorage.removeItem(testKey);
    } catch (error) {
      throw new Error("Storage access is denied or quota is exceeded");
    }
  }

  /**
   * Initializes a complete set of cryptographic keys for the application.
   * Generates RSA key pair and three AES-256 symmetric keys for website, auth, and data encryption.
   * @returns {Promise<KeySet>} A complete set of cryptographic keys including RSA and AES keys
   * @throws Error if key generation or initialization fails
   */
  public async InitializeKeys(): Promise<KeySet> {
    try {
      // Verify browser capabilities first
      await this.checkBrowserCapabilities();

      // Generate RSA key pair (4096-bit)
      const rsaKeyPair = await window.crypto.subtle.generateKey(
        {
          name: "RSA-OAEP",
          modulusLength: 4096,
          publicExponent: new Uint8Array([1, 0, 1]),
          hash: "SHA-256",
        },
        true,
        ["encrypt", "decrypt"]
      );

      // Generate AES-256 keys with IV for website, auth, and data encryption
      const generateSymmetricKey = async (): Promise<SymmetricKeys> => {
        try {
          const key = await window.crypto.subtle.generateKey(
            {
              name: "AES-GCM",
              length: 256,
            },
            true,
            ["encrypt", "decrypt"]
          );
          const rawKey = await window.crypto.subtle.exportKey("raw", key);
          const iv = window.crypto.getRandomValues(new Uint8Array(12));

          return {
            key: this.arrayBufferToBase64(rawKey),
            algorithm: "AES-GCM",
            length: 256,
            iv: this.arrayBufferToBase64(iv as any),
          };
        } catch (error: any) {
          throw new Error(`Failed to generate symmetric key: ${error.message}`);
        }
      };

      // Export RSA keys with error handling
      const [exportedPublicKey, exportedPrivateKey] = await Promise.all([
        window.crypto.subtle.exportKey("spki", rsaKeyPair.publicKey),
        window.crypto.subtle.exportKey("pkcs8", rsaKeyPair.privateKey),
      ]).catch((error) => {
        throw new Error(`Failed to export RSA keys: ${error.message}`);
      });

      this.keySet = {
        id: crypto.randomUUID(),
        version: 1,
        created: Date.now(),
        lastRotated: Date.now(),
        encryption: {
          publicKey: {
            key: this.arrayBufferToBase64(exportedPublicKey),
            algorithm: "RSA-OAEP",
            length: 4096,
            format: "spki",
          },
          privateKey: {
            key: this.arrayBufferToBase64(exportedPrivateKey),
            algorithm: "RSA-OAEP",
            length: 4096,
            format: "pkcs8",
            protected: false,
          },
        },
        websiteKey: await generateSymmetricKey(),
        authKey: await generateSymmetricKey(),
        dataKey: await generateSymmetricKey(),
      };

      // Store initialization state
      localStorage.setItem(
        `${this.storagePrefix}initialized`,
        JSON.stringify({ timestamp: Date.now() })
      );

      return this.keySet;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error occurred";
      throw new Error(`Failed to initialize encryption: ${errorMessage}`);
    }
  }

  /**
   * Converts an ArrayBuffer to a Base64 string representation.
   * @param {ArrayBuffer} buffer - The buffer to convert
   * @returns {string} Base64 encoded string
   */
  private arrayBufferToBase64(buffer: ArrayBuffer): string {
    const bytes = new Uint8Array(buffer);
    let binary = "";
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  }

  /**
   * Converts a Base64 string back to an ArrayBuffer.
   * @param {string} base64 - The Base64 string to convert
   * @returns {ArrayBuffer} The decoded ArrayBuffer
   */
  private base64ToArrayBuffer(base64: string): ArrayBuffer {
    const binaryString = atob(base64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes.buffer;
  }

  /**
   * Encrypts data using RSA-OAEP with a public key.
   * @param {string} data - The data to encrypt
   * @param {string} publicKey - Base64 encoded public key in SPKI format
   * @returns {Promise<string>} Base64 encoded encrypted data
   */
  async encryptData(data: string, publicKey: string): Promise<string> {
    // Use the Web Crypto API to encrypt the data
    const encoder = new TextEncoder();
    const encodedData = encoder.encode(data);

    const importedKey = await crypto.subtle.importKey(
      "spki",
      Buffer.from(publicKey, "base64"),
      {
        name: "RSA-OAEP",
        hash: "SHA-256",
      },
      false,
      ["encrypt"]
    );

    const encryptedData = await crypto.subtle.encrypt(
      { name: "RSA-OAEP" },
      importedKey,
      encodedData
    );

    return Buffer.from(encryptedData).toString("base64");
  }

  /**
   * Encrypts data using AES-GCM symmetric encryption.
   * @param {string} data - The data to encrypt
   * @param {SymmetricKeys} symmetricKey - The symmetric key configuration including key and IV
   * @returns {Promise<string>} Base64 encoded encrypted data
   */
  public async encryptSymmetric(
    data: string,
    symmetricKey: SymmetricKeys
  ): Promise<string> {
    const encoder = new TextEncoder();
    const encodedData = encoder.encode(data);

    const key = await crypto.subtle.importKey(
      "raw",
      Buffer.from(symmetricKey.key, "base64"),
      { name: "AES-GCM" },
      false,
      ["encrypt"]
    );

    const encryptedData = await crypto.subtle.encrypt(
      {
        name: "AES-GCM",
        iv: Buffer.from(symmetricKey.iv, "base64"),
      },
      key,
      encodedData
    );

    return Buffer.from(encryptedData).toString("base64");
  }

  /**
   * Decrypts data using AES-GCM symmetric encryption.
   * @param {string} encryptedData - Base64 encoded encrypted data
   * @param {SymmetricKeys} symmetricKey - The symmetric key configuration including key and IV
   * @returns {Promise<string>} Decrypted data as string
   */
  public async decryptSymmetric(
    encryptedData: string,
    symmetricKey: SymmetricKeys
  ): Promise<string> {
    const key = await crypto.subtle.importKey(
      "raw",
      Buffer.from(symmetricKey.key, "base64"),
      { name: "AES-GCM" },
      false,
      ["decrypt"]
    );

    const decryptedData = await crypto.subtle.decrypt(
      {
        name: "AES-GCM",
        iv: Buffer.from(symmetricKey.iv, "base64"),
      },
      key,
      Buffer.from(encryptedData, "base64")
    );

    return new TextDecoder().decode(decryptedData);
  }

  /**
   * Initializes an account by encrypting website and authentication information.
   * @param {string} website - The website URL or identifier
   * @param {string} authKey - The authentication key
   * @returns {Promise<{encryptedWebsite: string, encryptedAuthKey: string, keySet: KeySet}>}
   */
  public async InitAccount(
    website: string,
    authKey: string
  ): Promise<{
    encryptedWebsite: string;
    encryptedAuthKey: string;
    keySet: KeySet;
  }> {
    if (!this.keySet) {
      this.keySet = await this.InitializeKeys();
    }

    const encryptedWebsite = await this.encryptSymmetric(
      website,
      this.keySet.websiteKey
    );
    const encryptedAuthKey = await this.encryptSymmetric(
      authKey,
      this.keySet.authKey
    );

    return {
      encryptedWebsite,
      encryptedAuthKey,
      keySet: this.keySet,
    };
  }

  /**
   * Starts the extension by decrypting website and authentication information.
   * @param {string} encryptedWebsite - The encrypted website data
   * @param {string} encryptedAuthKey - The encrypted authentication key
   * @param {KeySet} keySet - The key set used for decryption
   * @returns {Promise<{website: string, authKey: string}>}
   */
  public async startExtensio(
    encryptedWebsite: string,
    encryptedAuthKey: string,
    keySet: KeySet
  ): Promise<{
    website: string;
    authKey: string;
  }> {
    const website = await this.decryptSymmetric(
      encryptedWebsite,
      keySet.websiteKey
    );
    const authKey = await this.decryptSymmetric(
      encryptedAuthKey,
      keySet.authKey
    );

    return { website, authKey };
  }

  /**
   * Decrypts data using RSA-OAEP with a private key.
   * @param {string} encryptedData - Base64 encoded encrypted data
   * @param {string} privateKey - Base64 encoded private key in PKCS8 format
   * @returns {Promise<string>} Decrypted data as string
   */
  public async decryptData(
    encryptedData: string,
    privateKey: string
  ): Promise<string> {
    const importedKey = await crypto.subtle.importKey(
      "pkcs8",
      Buffer.from(privateKey, "base64"),
      {
        name: "RSA-OAEP",
        hash: "SHA-256",
      },
      false,
      ["decrypt"]
    );

    const decryptedData = await crypto.subtle.decrypt(
      { name: "RSA-OAEP" },
      importedKey,
      Buffer.from(encryptedData, "base64")
    );

    return new TextDecoder().decode(decryptedData);
  }

  /**
   * Derives a cryptographic key from a password using PBKDF2.
   * @param {string} password - The password to derive the key from
   * @param {Object} options - Key derivation options
   * @param {Uint8Array} options.salt - Salt for key derivation
   * @param {number} options.iterations - Number of iterations for PBKDF2
   * @param {number} options.keyLength - Length of the derived key in bits
   * @returns {Promise<CryptoKey>} Derived cryptographic key
   */
  public async deriveKey(
    password: string,
    options: {
      salt: Uint8Array;
      iterations: number;
      keyLength: number;
    }
  ): Promise<CryptoKey> {
    const encoder = new TextEncoder();
    const passwordBuffer = encoder.encode(password);

    // Import password as raw key material
    const baseKey = await window.crypto.subtle.importKey(
      "raw",
      passwordBuffer,
      "PBKDF2",
      false,
      ["deriveBits", "deriveKey"]
    );

    // Derive the key using PBKDF2
    return await window.crypto.subtle.deriveKey(
      {
        name: "PBKDF2",
        salt: options.salt,
        iterations: options.iterations,
        hash: "SHA-256",
      },
      baseKey,
      { name: "AES-GCM", length: options.keyLength },
      true,
      ["encrypt", "decrypt"]
    );
  }

  /**
   * Encrypts a private key using a master key for additional protection.
   * @param {string} privateKeyBase64 - Base64 encoded private key
   * @param {CryptoKey} masterKey - Master key for encryption
   * @returns {Promise<string>} Protected private key as Base64 string
   */
  public async protectPrivateKey(
    privateKeyBase64: string,
    masterKey: CryptoKey
  ): Promise<string> {
    // Generate a random IV for encryption
    const iv = window.crypto.getRandomValues(new Uint8Array(12));

    // Encrypt the private key using the master key
    const encryptedPrivateKey = await window.crypto.subtle.encrypt(
      {
        name: "AES-GCM",
        iv: iv,
      },
      masterKey,
      Buffer.from(privateKeyBase64, "base64")
    );

    // Combine IV and encrypted data
    const combined = new Uint8Array(iv.length + encryptedPrivateKey.byteLength);
    combined.set(iv);
    combined.set(new Uint8Array(encryptedPrivateKey), iv.length);

    // Return as base64 string
    return Buffer.from(combined).toString("base64");
  }

  /**
   * Decrypts a protected private key using the master key.
   * @param {string} protectedKeyBase64 - Protected private key as Base64 string
   * @param {CryptoKey} masterKey - Master key for decryption
   * @returns {Promise<string>} Decrypted private key as Base64 string
   */
  public async decryptPrivateKey(
    protectedKeyBase64: string,
    masterKey: CryptoKey
  ): Promise<string> {
    const combined = Buffer.from(protectedKeyBase64, "base64");

    // Extract IV and encrypted data
    const iv = combined.slice(0, 12);
    const encryptedData = combined.slice(12);

    // Decrypt the private key
    const decryptedPrivateKey = await window.crypto.subtle.decrypt(
      {
        name: "AES-GCM",
        iv: iv,
      },
      masterKey,
      encryptedData
    );

    return Buffer.from(decryptedPrivateKey).toString("base64");
  }
}

export default Encrypt;
