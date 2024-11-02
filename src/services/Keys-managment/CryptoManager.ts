// import { subtle } from "crypto";

// interface KeySet {
//   websiteKey: string;
//   authKey: string;
//   dataKey: string;
//   rsaPublicKey: string;
//   rsaPrivateKey: string;
//   biometricKey?: string;
// }

// class CryptoManager {
//   decrypt(website: any) {
//     throw new Error("Method not implemented.");
//   }
//   private keys: KeySet | null = null;
//   private readonly PBKDF2_ITERATIONS = 600000;
//   private readonly AES_KEY_LENGTH = 256;

//   constructor() {
//     // Initialize with stored keys if they exist
//     this.initializeKeys();
//   }

//   public async initializeKeys(): Promise<void> {
//     try {
//       // Try to load keys from secure storage
//       const storedKeys = await chrome.storage.local.get("secureKeys");
//       if (storedKeys.secureKeys) {
//         this.keys = await this.decryptKeys(storedKeys.secureKeys);
//       }
//     } catch (error) {
//       console.error("Failed to initialize keys:", error);
//       throw new Error("Key initialization failed");
//     }
//   }

//   public async generateNewKeys(): Promise<KeySet> {
//     try {
//       // Generate RSA key pair
//       const rsaKeyPair = await subtle.generateKey(
//         {
//           name: "RSA-OAEP",
//           modulusLength: 4096,
//           publicExponent: new Uint8Array([1, 0, 1]),
//           hash: "SHA-512",
//         },
//         true,
//         ["encrypt", "decrypt"]
//       );

//       // Generate AES keys for different purposes
//       const websiteKey = await this.generateAESKey();
//       const authKey = await this.generateAESKey();
//       const dataKey = await this.generateAESKey();

//       // Export keys to string format
//       const keys: KeySet = {
//         websiteKey: await this.exportKey(websiteKey),
//         authKey: await this.exportKey(authKey),
//         dataKey: await this.exportKey(dataKey),
//         rsaPublicKey: await this.exportKey(rsaKeyPair.publicKey),
//         rsaPrivateKey: await this.exportKey(rsaKeyPair.privateKey),
//       };

//       // Store keys securely
//       await this.securelyStoreKeys(keys);
//       this.keys = keys;
//       return keys;
//     } catch (error) {
//       console.error("Failed to generate keys:", error);
//       throw new Error("Key generation failed");
//     }
//   }

//   private async generateAESKey(): Promise<CryptoKey> {
//     return await subtle.generateKey(
//       {
//         name: "AES-GCM",
//         length: this.AES_KEY_LENGTH,
//       },
//       true,
//       ["encrypt", "decrypt"]
//     );
//   }

//   public async encryptPassword(password: string): Promise<EncryptedPassword> {
//     if (!this.keys?.dataKey) {
//       throw new Error("Encryption keys not initialized");
//     }

//     const iv = crypto.getRandomValues(new Uint8Array(12));
//     const dataKey = await this.importKey(this.keys.dataKey);

//     const encryptedData = await subtle.encrypt(
//       {
//         name: "AES-GCM",
//         iv,
//       },
//       dataKey,
//       new TextEncoder().encode(password)
//     );

//     return {
//       id: crypto.randomUUID(),
//       encryptedPassword: this.arrayBufferToBase64(encryptedData),
//       iv: this.arrayBufferToBase64(iv.buffer),
//     };
//   }

//   public async decryptPassword(
//     encryptedData: EncryptedPassword
//   ): Promise<string> {
//     if (!this.keys?.dataKey) {
//       throw new Error("Decryption keys not initialized");
//     }

//     const dataKey = await this.importKey(this.keys.dataKey);
//     const decrypted = await subtle.decrypt(
//       {
//         name: "AES-GCM",
//         iv: this.base64ToArrayBuffer(encryptedData.iv),
//       },
//       dataKey,
//       this.base64ToArrayBuffer(encryptedData.encryptedPassword)
//     );

//     return new TextDecoder().decode(decrypted);
//   }

//   private async securelyStoreKeys(keys: KeySet): Promise<void> {
//     // Encrypt keys before storing
//     const encryptedKeys = await this.encryptKeys(keys);
//     await chrome.storage.local.set({ secureKeys: encryptedKeys });
//   }

//   private async encryptKeys(keys: KeySet): Promise<string> {
//     // Implementation of key encryption using a master key derived from user password
//     // This is a placeholder - actual implementation would need more security measures
//     return JSON.stringify(keys);
//   }

//   private async decryptKeys(encryptedKeys: string): Promise<KeySet> {
//     // Implementation of key decryption
//     // This is a placeholder - actual implementation would need more security measures
//     return JSON.parse(encryptedKeys);
//   }

//   private arrayBufferToBase64(buffer: ArrayBuffer): string {
//     return btoa(String.fromCharCode(...new Uint8Array(buffer)));
//   }

//   private base64ToArrayBuffer(base64: string): ArrayBuffer {
//     const binaryString = atob(base64);
//     const bytes = new Uint8Array(binaryString.length);
//     for (let i = 0; i < binaryString.length; i++) {
//       bytes[i] = binaryString.charCodeAt(i);
//     }
//     return bytes.buffer;
//   }

//   // Additional utility methods for key management
//   public async importKey(keyData: string): Promise<CryptoKey> {
//     // Implementation of key import
//     throw new Error("Not implemented");
//   }

//   private async exportKey(key: CryptoKey): Promise<string> {
//     // Implementation of key export
//     throw new Error("Not implemented");
//   }
// }

// interface EncryptedPassword {
//   id: string;
//   encryptedPassword: string;
//   iv: string;
// }

// export default CryptoManager;
