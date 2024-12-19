import { CryptoUtils } from "../Keys-managment/CryptoUtils";
import { CredentialCryptoService } from "../Keys-managment/CredentialCrypto";
import { SecureStorageService } from "../storage/WindowsHelloStorage";
import { WindowsHelloVerifier } from "./WindowsHelloVerifier";
import { KeySet, SessionSettings } from "../types";

export class BackupSecurityService {
  private static instance: BackupSecurityService | null = null;
  private readonly BACKUP_VERSION = "1.0";
  private readonly ENCRYPTION_ALGORITHM = "AES-GCM";
  private readonly KEY_LENGTH = 256;

  private constructor() {}

  public static getInstance(): BackupSecurityService {
    if (!this.instance) {
      this.instance = new BackupSecurityService();
    }
    return this.instance;
  }

  private async encryptBackupData(
    data: string,
    password: string
  ): Promise<{ encrypted: string; salt: string; iv: string }> {
    try {
      // Generate salt and IV
      const salt = window.crypto.getRandomValues(new Uint8Array(16));
      const iv = window.crypto.getRandomValues(new Uint8Array(12));

      // Derive key from password
      const encoder = new TextEncoder();
      const keyMaterial = await window.crypto.subtle.importKey(
        "raw",
        encoder.encode(password),
        "PBKDF2",
        false,
        ["deriveBits", "deriveKey"]
      );

      const key = await window.crypto.subtle.deriveKey(
        {
          name: "PBKDF2",
          salt: salt,
          iterations: 100000,
          hash: "SHA-256",
        },
        keyMaterial,
        { name: "AES-GCM", length: 256 },
        false,
        ["encrypt"]
      );

      // Encrypt the data
      const encryptedContent = await window.crypto.subtle.encrypt(
        {
          name: "AES-GCM",
          iv: iv,
        },
        key,
        encoder.encode(data)
      );

      return {
        encrypted: CryptoUtils.bufferToBase64(encryptedContent),
        salt: CryptoUtils.bufferToBase64(salt.buffer),
        iv: CryptoUtils.bufferToBase64(iv.buffer),
      };
    } catch (error) {
      console.error("Encryption failed:", error);
      throw new Error("Failed to encrypt backup data");
    }
  }

  private async decryptBackupData(
    encryptedData: string,
    password: string,
    salt: string,
    iv: string
  ): Promise<string> {
    try {
      // Convert base64 strings back to buffers
      const encryptedBuffer = CryptoUtils.base64ToBuffer(encryptedData);
      const saltBuffer = CryptoUtils.base64ToBuffer(salt);
      const ivBuffer = CryptoUtils.base64ToBuffer(iv);

      // Derive the same key from password
      const encoder = new TextEncoder();
      const keyMaterial = await window.crypto.subtle.importKey(
        "raw",
        encoder.encode(password),
        "PBKDF2",
        false,
        ["deriveBits", "deriveKey"]
      );

      const key = await window.crypto.subtle.deriveKey(
        {
          name: "PBKDF2",
          salt: saltBuffer,
          iterations: 100000,
          hash: "SHA-256",
        },
        keyMaterial,
        { name: "AES-GCM", length: 256 },
        false,
        ["decrypt"]
      );

      // Decrypt the data
      const decryptedContent = await window.crypto.subtle.decrypt(
        {
          name: "AES-GCM",
          iv: ivBuffer,
        },
        key,
        encryptedBuffer
      );

      return new TextDecoder().decode(decryptedContent);
    } catch (error) {
      console.error("Decryption failed:", error);
      throw new Error(
        "Failed to decrypt backup data - incorrect password or corrupted backup"
      );
    }
  }

  public async createSecureBackup(password: string): Promise<Blob> {
    try {
      // Get stored keys and settings
      const keys = await SecureStorageService.getKeysFromStorage();
      const settings = await SecureStorageService.getSettingsFromStorage();

      if (!keys) {
        throw new Error("No keys found to backup");
      }

      // Create backup data structure
      const backupData = {
        keys,
        settings,
        timestamp: Date.now(),
      };

      // Encrypt the backup data
      const encrypted = await this.encryptBackupData(
        JSON.stringify(backupData),
        password
      );

      // Create final backup structure
      const finalBackup = {
        metadata: {
          version: this.BACKUP_VERSION,
          timestamp: Date.now(),
          salt: encrypted.salt,
          iv: encrypted.iv,
        },
        data: encrypted.encrypted,
      };

      // Convert to Blob
      return new Blob([JSON.stringify(finalBackup)], {
        type: "application/mepassword-backup",
      });
    } catch (error) {
      console.error("Backup creation failed:", error);
      throw new Error("Failed to create secure backup");
    }
  }

  public async restoreFromBackup(
    backupFile: Blob,
    password: string
  ): Promise<KeySet> {
    try {
      // Read and parse backup file
      const backupContent = await backupFile.text();
      const backup = JSON.parse(backupContent);

      // Validate backup format and version
      if (
        !backup.metadata ||
        !backup.data ||
        !backup.metadata.salt ||
        !backup.metadata.iv
      ) {
        throw new Error("Invalid backup format");
      }

      if (backup.metadata.version !== this.BACKUP_VERSION) {
        throw new Error("Unsupported backup version");
      }

      // Decrypt the backup data
      const decryptedContent = await this.decryptBackupData(
        backup.data,
        password,
        backup.metadata.salt,
        backup.metadata.iv
      );

      // Parse the decrypted content
      const backupData = JSON.parse(decryptedContent);

      // Validate decrypted data structure
      if (!backupData.keys || !backupData.timestamp) {
        throw new Error("Invalid backup data structure");
      }

      // Store the restored data
      await SecureStorageService.storeKeys(backupData.keys);
      if (backupData.settings) {
        await SecureStorageService.storeSettings(backupData.settings);
      }

      return backupData.keys;
    } catch (error) {
      console.error("Backup restoration failed:", error);
      throw error;
    }
  }

  private validateBackup(backup: any): void {
    if (!backup.metadata || !backup.data) {
      throw new Error("Invalid backup format");
    }

    if (backup.metadata.version !== this.BACKUP_VERSION) {
      throw new Error("Unsupported backup version");
    }

    if (!backup.metadata.iv) {
      throw new Error("Missing encryption IV in backup");
    }
  }

 
}
