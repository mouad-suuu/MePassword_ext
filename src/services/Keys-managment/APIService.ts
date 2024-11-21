import {
  APISettingsPayload,
  NewEncryptedPassword,
  SessionSettings,
  SymmetricKeys,
} from "../types";
import { CredentialCryptoService } from "./CredentialCrypto";
import StoringService from "../StorageService";
import { v4 as uuidv4 } from "uuid";
import EncryptionService from "../EncryptionService";

export class APIService {
  private static async handleApiError(
    error: any,
    endpoint: string
  ): Promise<never> {
    if (error instanceof Response) {
      const errorBody = await error
        .text()
        .catch(() => "Unable to read error response");
      throw new Error(
        `API ${endpoint} failed with status ${error.status}: ${errorBody}`
      );
    }
    if (error instanceof Error) {
      throw new Error(`${endpoint} error: ${error.message}`);
    }
    throw new Error(`Unexpected ${endpoint} error: ${String(error)}`);
  }
  public static async SettingsPost(publicKey: string): Promise<Response> {
    try {
      const storedKeys = await StoringService.Keys.getKeysFromStorage();
      const decryptedCredentials =
        await CredentialCryptoService.decryptCredentials(
          storedKeys.Credentials,
          {
            key: storedKeys.AESKey,
            iv: storedKeys.IV,
            algorithm: "AES-GCM",
            length: 256,
          }
        );

      const response = await fetch(
        `${decryptedCredentials.server}/api/settings`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${decryptedCredentials.authToken}`,
          },
          body: JSON.stringify({
            publicKey: publicKey,
            password: decryptedCredentials.password,
            deviceId: uuidv4(),
            timestamp: Date.now(),
          }),
        }
      );

      if (!response.ok) {
        throw response;
      }

      return response;
    } catch (error: any) {
      return this.handleApiError(error, "SettingsPost");
    }
  }
  public static async validatePassword(password: string): Promise<boolean> {
    try {
      console.log("Validating the password:", password);
      const storedKeys = await StoringService.Keys.getKeysFromStorage();
      const decryptedCredentials =
        await CredentialCryptoService.decryptCredentials(
          storedKeys.Credentials,
          {
            key: storedKeys.AESKey,
            iv: storedKeys.IV,
            algorithm: "AES-GCM",
            length: 256,
          }
        );

      const response = await fetch(
        `${decryptedCredentials.server}/api/settings/validate`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${decryptedCredentials.authToken}`,
          },
          body: JSON.stringify({
            password: password,
          }),
        }
      );

      if (!response.ok) {
        throw response;
      }
      const jsonResponse = await response.json();
      console.log("Password is valid:", jsonResponse.isValid);
      return jsonResponse.isValid;
    } catch (error: any) {
      return this.handleApiError(error, "SettingsPost");
    }
  }
  public static async SettingGet(): Promise<Response> {
    try {
      const storedKeys = await StoringService.Keys.getKeysFromStorage();
      const decryptedCredentials =
        await CredentialCryptoService.decryptCredentials(
          storedKeys.Credentials,
          {
            key: storedKeys.AESKey,
            iv: storedKeys.IV,
            algorithm: "AES-GCM",
            length: 256,
          }
        );

      const response = await fetch(
        `${decryptedCredentials.server}/api/settings`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${decryptedCredentials.authToken}`,
            "Content-Type": "application/json",
          },
        }
      );
      if (!response.ok) {
        throw response;
      }
      return response;
    } catch (error: any) {
      return this.handleApiError(error, "SettingGet");
    }
  }
  public static async SettingsPut(
    settings: Partial<APISettingsPayload>
  ): Promise<Response> {
    const storedKeys = await StoringService.Keys.getKeysFromStorage();

    try {
      const decryptedCredentials =
        await CredentialCryptoService.decryptCredentials(
          storedKeys.Credentials,
          {
            key: storedKeys.AESKey,
            iv: storedKeys.IV,
            algorithm: "AES-GCM",
            length: 256,
          }
        ).catch((error) => {
          throw new Error(`Credential decryption failed: ${error.message}`);
        });

      const response = await fetch(
        `${decryptedCredentials.server}/api/settings`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${decryptedCredentials.authToken}`,
          },
          body: JSON.stringify(settings),
        }
      );

      if (!response.ok) {
        throw response;
      }

      return response;
    } catch (error: any) {
      return this.handleApiError(error, "SettingsPut");
    }
  }
  public static async PasswordsGet(): Promise<
    {
      id: string;
      website: string;
      user: string;
      password: string;
    }[]
  > {
    const storedKeys = await StoringService.Keys.getKeysFromStorage();
    try {
      const decryptedCredentials =
        await CredentialCryptoService.decryptCredentials(
          storedKeys.Credentials,
          {
            key: storedKeys.AESKey,
            iv: storedKeys.IV,
            algorithm: "AES-GCM",
            length: 256,
          }
        );

      const response = await fetch(
        `${decryptedCredentials.server}/api/passwords`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${decryptedCredentials.authToken}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        throw response;
      }

      const data = await response.json();

      if (!storedKeys?.privateKey) {
        throw new Error("No private key found in stored credentials");
      }

      const privateKey = await EncryptionService.Utils.importRSAPrivateKey(
        storedKeys.privateKey
      );

      if (!privateKey) {
        throw new Error("Failed to import private key");
      }

      const decryptedData = await EncryptionService.Utils.decryptWithRSA(
        data.passwords,
        privateKey
      );

      if (!decryptedData) {
        throw new Error("Decryption returned null or undefined");
      }

      if (!Array.isArray(decryptedData)) {
        throw new Error("Decrypted data is not an array");
      }

      return decryptedData.map((item, index) => ({
        id: data.passwords[index].id,
        website: item.website,
        user: item.user,
        password: item.password,
      }));
    } catch (error: any) {
      return this.handleApiError(error, "PasswordsGet");
    }
  }
  public static async PasswordPost(data: {
    website: string;
    user: string;
    password: string;
  }): Promise<Response> {
    const storedKeys = await StoringService.Keys.getKeysFromStorage();

    try {
      // Get decrypted credentials
      const decryptedCredentials =
        await CredentialCryptoService.decryptCredentials(
          storedKeys.Credentials,
          {
            key: storedKeys.AESKey,
            iv: storedKeys.IV,
            algorithm: "AES-GCM",
            length: 256,
          }
        );

      // Fetch public key from settings
      const settingsResponse = await this.SettingGet();
      if (!settingsResponse.ok) {
        throw new Error("Failed to fetch encryption settings");
      }

      const settings = await settingsResponse.json();
      if (!settings?.settings?.publicKey) {
        throw new Error("No public key found in settings");
      }

      // Encrypt the data
      const publicKey = await EncryptionService.Utils.importRSAPublicKey(
        settings.settings.publicKey
      );
      const encryptedData = await EncryptionService.Utils.encryptWithRSA(
        {
          website: data.website.trim(),
          user: data.user.trim(),
          password: data.password,
        },
        publicKey
      );

      // Send encrypted data
      const response = await fetch(
        `${decryptedCredentials.server}/api/passwords`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${decryptedCredentials.authToken}`,
          },
          body: JSON.stringify({
            id: uuidv4(),
            website: encryptedData.website,
            user: encryptedData.user,
            password: encryptedData.password,
          }),
        }
      );

      if (!response.ok) {
        throw response;
      }

      return response;
    } catch (error: any) {
      return this.handleApiError(error, "PasswordPost");
    }
  }
  public static async PasswordPut(
    id: string,
    data: {
      website: string;
      user: string;
      password: string;
    }
  ): Promise<Response> {
    const storedKeys = await StoringService.Keys.getKeysFromStorage();

    try {
      const decryptedCredentials =
        await CredentialCryptoService.decryptCredentials(
          storedKeys.Credentials,
          {
            key: storedKeys.AESKey,
            iv: storedKeys.IV,
            algorithm: "AES-GCM",
            length: 256,
          }
        );

      // Fetch public key from settings
      const settingsResponse = await this.SettingGet();
      if (!settingsResponse.ok) {
        throw new Error("Failed to fetch encryption settings");
      }

      const settings = await settingsResponse.json();
      if (!settings?.settings?.publicKey) {
        throw new Error("No public key found in settings");
      }

      // Encrypt the data
      const publicKey = await EncryptionService.Utils.importRSAPublicKey(
        settings.settings.publicKey
      );
      const encryptedData = await EncryptionService.Utils.encryptWithRSA(
        {
          website: data.website.trim(),
          user: data.user.trim(),
          password: data.password,
        },
        publicKey
      );

      const response = await fetch(
        `${decryptedCredentials.server}/api/passwords/${id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${decryptedCredentials.authToken}`,
          },
          body: JSON.stringify({
            ...encryptedData,
            id,
          }),
        }
      );

      if (!response.ok) {
        throw response;
      }

      return response;
    } catch (error: any) {
      return this.handleApiError(error, "PasswordPut");
    }
  }
  public static async KeysGet(): Promise<
    {
      id: string;
      website: string;
      user: string;
      password: string;
    }[]
  > {
    try {
      const storedKeys = await StoringService.Keys.getKeysFromStorage();
      const decryptedCredentials =
        await CredentialCryptoService.decryptCredentials(
          storedKeys.Credentials,
          {
            key: storedKeys.AESKey,
            iv: storedKeys.IV,
            algorithm: "AES-GCM",
            length: 256,
          }
        );

      const response = await fetch(`${decryptedCredentials.server}/api/keys`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${decryptedCredentials.authToken}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw response;
      }

      const data = await response.json();

      if (!storedKeys?.privateKey) {
        throw new Error("No private key found in stored credentials");
      }

      const privateKey = await EncryptionService.Utils.importRSAPrivateKey(
        storedKeys.privateKey
      );

      if (!privateKey) {
        throw new Error("Failed to import private key");
      }

      const decryptedData = await EncryptionService.Utils.decryptWithRSA(
        data.keys,
        privateKey
      );

      if (!decryptedData) {
        throw new Error("Decryption returned null or undefined");
      }

      if (!Array.isArray(decryptedData)) {
        throw new Error("Decrypted data is not an array");
      }

      return decryptedData.map((item, index) => ({
        id: data.keys[index].id,
        website: item.website,
        user: item.user,
        password: item.password,
      }));
    } catch (error: any) {
      return this.handleApiError(error, "KeysGet");
    }
  }
  public static async KeysPost(data: {
    website: string;
    user: string;
    password: string;
  }): Promise<Response> {
    try {
      const storedKeys = await StoringService.Keys.getKeysFromStorage();
      const decryptedCredentials =
        await CredentialCryptoService.decryptCredentials(
          storedKeys.Credentials,
          {
            key: storedKeys.AESKey,
            iv: storedKeys.IV,
            algorithm: "AES-GCM",
            length: 256,
          }
        );

      // Fetch public key from settings
      const settingsResponse = await this.SettingGet();
      if (!settingsResponse.ok) {
        throw new Error("Failed to fetch encryption settings");
      }

      const settings = await settingsResponse.json();
      if (!settings?.settings?.publicKey) {
        throw new Error("No public key found in settings");
      }

      // Encrypt the data
      const publicKey = await EncryptionService.Utils.importRSAPublicKey(
        settings.settings.publicKey
      );
      const encryptedData = await EncryptionService.Utils.encryptWithRSA(
        {
          website: data.website.trim(),
          user: data.user.trim(),
          password: data.password,
        },
        publicKey
      );

      const response = await fetch(`${decryptedCredentials.server}/api/keys`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${decryptedCredentials.authToken}`,
        },
        body: JSON.stringify({
          id: uuidv4(),
          ...encryptedData,
        }),
      });

      if (!response.ok) {
        throw response;
      }

      return response;
    } catch (error: any) {
      return this.handleApiError(error, "KeysPost");
    }
  }
  public static async KeysPut(
    id: string,
    data: {
      website: string;
      user: string;
      password: string;
    }
  ): Promise<Response> {
    try {
      const storedKeys = await StoringService.Keys.getKeysFromStorage();
      const decryptedCredentials =
        await CredentialCryptoService.decryptCredentials(
          storedKeys.Credentials,
          {
            key: storedKeys.AESKey,
            iv: storedKeys.IV,
            algorithm: "AES-GCM",
            length: 256,
          }
        );

      // Fetch public key from settings
      const settingsResponse = await this.SettingGet();
      if (!settingsResponse.ok) {
        throw new Error("Failed to fetch encryption settings");
      }

      const settings = await settingsResponse.json();
      if (!settings?.settings?.publicKey) {
        throw new Error("No public key found in settings");
      }

      // Encrypt the data
      const publicKey = await EncryptionService.Utils.importRSAPublicKey(
        settings.settings.publicKey
      );
      const encryptedData = await EncryptionService.Utils.encryptWithRSA(
        {
          website: data.website.trim(),
          user: data.user.trim(),
          password: data.password,
        },
        publicKey
      );

      const response = await fetch(
        `${decryptedCredentials.server}/api/keys/${id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${decryptedCredentials.authToken}`,
          },
          body: JSON.stringify({
            ...encryptedData,
            id,
          }),
        }
      );

      if (!response.ok) {
        throw response;
      }

      return response;
    } catch (error: any) {
      return this.handleApiError(error, "KeysPut");
    }
  }
}
