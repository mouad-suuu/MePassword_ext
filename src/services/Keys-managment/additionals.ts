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
 */

class AdditionalMethods {
  private static readonly SALT_LENGTH = 16;
  private static readonly IV_LENGTH = 12;
  private static readonly KEY_LENGTH = 32;
  private static readonly PBKDF2_ITERATIONS = 100000;
  private static readonly DEBUG = true;
  public static logDebug(method: string, message: string, data?: any) {
    if (this.DEBUG) {
      console.log(`[EncryptionService:${method}] ${message}`, data || "");
    }
  }

  // Add session storage property
  public static sessionData = new Map<string, any>();

  private static formatTime(milliseconds: number): string {
    const days = Math.floor(milliseconds / (1000 * 60 * 60 * 24));
    const hours = Math.floor(milliseconds / (1000 * 60 * 60));
    const minutes = Math.floor((milliseconds % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((milliseconds % (1000 * 60)) / 1000);
    const ms = milliseconds % 1000;

    const parts = [];
    if (days > 0) parts.push(`${days}d`);
    if (hours > 0) parts.push(`${hours}h`);
    if (minutes > 0) parts.push(`${minutes}m`);
    if (seconds > 0) parts.push(`${seconds}s`);
    if (ms > 0) parts.push(`${ms}ms`);

    return parts.join(" ") || "0ms";
  }

  /**
   * Logs debug message with execution time
   */
  public static logTime(message: string, timeInMs: number) {
    if (this.DEBUG) {
      const formattedTime = this.formatTime(timeInMs);
      console.log(` ${message} (took ${formattedTime})`);
    }
  }

  // Add session storage property

  public static logError(method: string, error: any) {
    console.error(`[EncryptionService:${method}] Error:`, {
      message: error.message,
      stack: error.stack,
      details: error,
    });
  }
}

export default AdditionalMethods;
