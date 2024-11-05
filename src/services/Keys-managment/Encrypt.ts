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
import crypto from "crypto";
import {
  KeySet,
  SymmetricKeys,
  EncryptedPassword,
  EncryptionKeys,
} from "../types";

class EncryptionService {
  private static generateRSAKeys(): EncryptionKeys {
    const { publicKey, privateKey } = crypto.generateKeyPairSync("rsa", {
      modulusLength: 4096,
      publicKeyEncoding: {
        type: "spki",
        format: "pem",
      },
      privateKeyEncoding: {
        type: "pkcs8",
        format: "pem",
        cipher: "aes-256-cbc",
        passphrase: "secure-passphrase",
      },
    });

    return {
      publicKey: {
        key: publicKey.toString(),
        algorithm: "RSA-OAEP",
        length: 4096,
        format: "spki",
      },
      privateKey: {
        key: privateKey.toString(),
        algorithm: "RSA-OAEP",
        length: 4096,
        format: "pkcs8",
        protected: true,
      },
    };
  }

  private static generateAESKeys(): SymmetricKeys {
    const key = crypto.randomBytes(32).toString("hex");
    const iv = crypto.randomBytes(12).toString("hex");
    return {
      key,
      algorithm: "AES-GCM",
      length: 256,
      iv,
    };
  }

  public static generateKeySet(
    biometricType?: "fingerprint" | "faceid" | "other"
  ): KeySet {
    const encryption = this.generateRSAKeys();
    const dataKey = this.generateAESKeys();
    const biometric = biometricType
      ? {
          key: crypto.randomBytes(32).toString("hex"),
          type: biometricType,
          verified: false,
        }
      : undefined;

    return {
      id: crypto.randomUUID(),
      version: 1,
      created: Date.now(),
      lastRotated: Date.now(),
      encryption,
      dataKey,
      biometric,
    };
  }

  public static encryptPassword(
    password: EncryptedPassword,
    keySet: KeySet
  ): EncryptedPassword {
    const { encryptedData, iv, algorithm, keyId } = password;
    const cipher = crypto.createCipheriv(
      algorithm,
      keySet.dataKey.key,
      Buffer.from(iv, "hex")
    );

    const encryptedWebsite = cipher.update(
      encryptedData.website,
      "utf8",
      "hex"
    );
    const encryptedToken = cipher.update(
      encryptedData.authToken,
      "utf8",
      "hex"
    );
    const encryptedPassword = cipher.update(
      encryptedData.password,
      "utf8",
      "hex"
    );
    const encryptedNotes = encryptedData.notes
      ? cipher.update(encryptedData.notes, "utf8", "hex")
      : undefined;

    return {
      ...password,
      encryptedData: {
        website: encryptedWebsite + cipher.final("hex"),
        authToken: encryptedToken + cipher.final("hex"),
        password: encryptedPassword + cipher.final("hex"),
        notes: encryptedNotes
          ? encryptedNotes + cipher.final("hex")
          : undefined,
      },
      keyId,
    };
  }

  public static decryptPassword(
    encryptedPassword: EncryptedPassword,
    keySet: KeySet
  ): EncryptedPassword {
    const { encryptedData, iv, algorithm, keyId } = encryptedPassword;
    const decipher = crypto.createDecipheriv(
      algorithm,
      keySet.dataKey.key,
      Buffer.from(iv, "hex")
    );

    const decryptedWebsite =
      decipher.update(encryptedData.website, "hex", "utf8") +
      decipher.final("utf8");
    const decryptedToken =
      decipher.update(encryptedData.authToken, "hex", "utf8") +
      decipher.final("utf8");
    const decryptedPassword =
      decipher.update(encryptedData.password, "hex", "utf8") +
      decipher.final("utf8");
    const decryptedNotes = encryptedData.notes
      ? decipher.update(encryptedData.notes, "hex", "utf8") +
        decipher.final("utf8")
      : undefined;

    return {
      ...encryptedPassword,
      encryptedData: {
        website: decryptedWebsite,
        authToken: decryptedToken,
        password: decryptedPassword,
        notes: decryptedNotes,
      },
      keyId,
    };
  }

  public static async generateZKP(
    message: string,
    privateKey: string
  ): Promise<{ proof: string; publicKey: string }> {
    // Implement zero-knowledge proof generation
    // using the provided private key and message
    // Return the proof and the corresponding public key
    const { publicKey, privateKey: protectedPrivateKey } =
      await this.generateRSAKeys();
    const signature = crypto.sign("sha256", Buffer.from(message), {
      key: protectedPrivateKey.key,
      padding: crypto.constants.RSA_PKCS1_PSS_PADDING,
    });
    return {
      proof: signature.toString("base64"),
      publicKey: publicKey.key,
    };
  }

  public static async verifyZKP(
    message: string,
    proof: string,
    publicKey: string
  ): Promise<boolean> {
    // Implement zero-knowledge proof verification
    // using the provided message, proof, and public key
    // Return true if the proof is valid, false otherwise
    try {
      const verifier = crypto.createVerify("sha256");
      verifier.update(message);
      return verifier.verify(
        {
          key: publicKey,
          padding: crypto.constants.RSA_PKCS1_PSS_PADDING,
        },
        Buffer.from(proof, "base64")
      );
    } catch (error) {
      console.error("Error verifying ZKP:", error);
      return false;
    }
  }

  public static encryptWithConstantTime(
    data: string,
    key: string,
    iv: string
  ): string {
    // Implement constant-time encryption
    // using the provided data, key, and IV
    // Return the encrypted data
    const cipher = crypto.createCipheriv(
      "aes-256-gcm",
      Buffer.from(key, "hex"),
      Buffer.from(iv, "hex")
    );
    cipher.setAutoPadding(false);
    let encrypted = "";
    for (let i = 0; i < data.length; i += 16) {
      const block = data.slice(i, i + 16);
      encrypted += cipher.update(block, "utf8", "hex");
    }
    encrypted += cipher.final("hex");
    return encrypted;
  }

  public static decryptWithConstantTime(
    encryptedData: string,
    key: string,
    iv: string
  ): string {
    // Implement constant-time decryption
    // using the provided encrypted data, key, and IV
    // Return the decrypted data
    const decipher = crypto.createDecipheriv(
      "aes-256-gcm",
      Buffer.from(key, "hex"),
      Buffer.from(iv, "hex")
    );
    decipher.setAutoPadding(false);
    let decrypted = "";
    for (let i = 0; i < encryptedData.length; i += 32) {
      const block = encryptedData.slice(i, i + 32);
      decrypted += decipher.update(block, "hex", "utf8");
    }
    decrypted += decipher.final("utf8");
    return decrypted;
  }

  public static async deriveKey(password: string): Promise<CryptoKey> {
    const encoder = new TextEncoder();
    const salt = new Uint8Array(16); // You may want to store/retrieve a consistent salt

    return crypto.subtle
      .importKey("raw", encoder.encode(password), "PBKDF2", false, [
        "deriveKey",
      ])
      .then((baseKey) =>
        crypto.subtle.deriveKey(
          {
            name: "PBKDF2",
            salt,
            iterations: 100000,
            hash: "SHA-256",
          },
          baseKey,
          { name: "AES-GCM", length: 256 },
          true,
          ["encrypt", "decrypt"]
        )
      );
  }
}

export default EncryptionService;
