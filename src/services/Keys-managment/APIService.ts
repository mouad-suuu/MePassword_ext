import {
  APISettingsPayload,
} from "../types";

import StoringService from "../StorageService";
import { v4 as uuidv4 } from "uuid";
import { NetworkSecurityService } from "../auth&security/NetworkSecurityService";
import { CryptoUtils } from "./CryptoUtils";
import { BaseEncryptionService } from "./BaseEncryptionService";
import DecryptService from "./Decrypt";
import { CredentialCryptoService } from "./CredentialCrypto";
import {SessionManagementService} from "../sessionManagment/SessionManager"; // Import SessionManagementService

export class APIService {
  private static networkSecurity = NetworkSecurityService.getInstance();

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
      console.log("SettingsPost: Starting to send settings");
      const storedKeys = await StoringService.Keys.getKeysFromStorage();
      console.log("SettingsPost: Retrieved stored keys");

      if (!storedKeys || !storedKeys.Credentials) {
        throw new Error("No stored credentials found");
      }

      const decryptedCredentials = await CredentialCryptoService.decryptCredentials(
        storedKeys.Credentials,
        {
          key: storedKeys.AESKey,
          iv: storedKeys.IV,
          algorithm: "AES-GCM",
          length: 256
        }
      );
      console.log("SettingsPost: Credentials decrypted");

      if (!decryptedCredentials.userId) {
        throw new Error("User ID not found in credentials");
      }
      console.log("Importing AES key...");
      const key = await CryptoUtils.importAESKey(storedKeys.AESKey);
      const iv = CryptoUtils.base64ToBuffer(storedKeys.IV);

      // Encrypt the password
      console.log("Encrypting password...");
      const encryptedPassword = await CryptoUtils.encryptString(decryptedCredentials.password, key, iv);

      const settings: APISettingsPayload = {
        publicKey,
        userId: decryptedCredentials.userId,
        password: encryptedPassword,
        deviceId: uuidv4(),
        timestamp: Date.now(),
        sessionSettings: await SessionManagementService.getSessionSettings()
      };

      return await this.networkSecurity.secureRequest("/api/settings", {
        method: "POST",
        body: JSON.stringify(settings),
      });
    } catch (error: any) {
      console.error("SettingsPost error:", error);
      return this.handleApiError(error, "SettingsPost");
    }
  }

  public static async validatePassword(password: string): Promise<boolean> {
    try {
      console.log("Validating the password:", password);
      const storedKeys = await StoringService.Keys.getKeysFromStorage();
      const key = await CryptoUtils.importAESKey(storedKeys.AESKey);
      const iv = CryptoUtils.base64ToBuffer(storedKeys.IV);

      const NewEncryptedPassword = await CryptoUtils.encryptString(password, key, iv);

      const response = await this.networkSecurity.secureRequest(
        "/api/settings/validate",
        {
          method: "POST",
          body: JSON.stringify({ NewEncryptedPassword }),
        }
      );

      const jsonResponse = await response.json();
      console.log("Password is valid:", jsonResponse.isValid);
      return jsonResponse.isValid;
    } catch (error: any) {
      return this.handleApiError(error, "SettingsPost");
    }
  }

  public static async SettingGet(): Promise<Response> {
    try {
      console.log("SettingGet: Starting to fetch settings");
      const storedKeys = await StoringService.Keys.getKeysFromStorage();
      console.log("SettingGet: Retrieved stored keys:", storedKeys ? "Keys found" : "No keys found");
      
      if (!storedKeys || !storedKeys.Credentials) {
        console.error("SettingGet: No stored credentials found");
        throw new Error("No stored credentials found");
      }
      
      console.log("SettingGet: Starting credential decryption");
      const result = await CredentialCryptoService.decryptCredentials(
        storedKeys.Credentials,
        {
          key: storedKeys.AESKey,
          iv: storedKeys.IV,
          algorithm: "AES-GCM",
          length: 256
        }
      );
      console.log("SettingGet: Credentials decrypted successfully");

      const userId = result.userId || "";
      console.log("SettingGet: Using userId:", userId ? "Valid ID found" : "No valid ID");

      return await this.networkSecurity.secureRequest(`/api/settings?userId=${encodeURIComponent(userId)}`, {
        method: "GET",
      });
    } catch (error: any) {
      console.error("SettingGet: Error occurred:", error.message);
      return this.handleApiError(error, "SettingsGet");
    }
  }

  public static async SettingsPut(
    settings: Partial<APISettingsPayload>
  ): Promise<Response> {
    try {
      console.log("SettingsPut: Starting to update settings", {
        hasUserId: !!settings.userId,
        userId: settings.userId,
        hasPublicKey: !!settings.publicKey,
        hasSessionSettings: !!settings.sessionSettings,
        settings: JSON.stringify(settings)
      });

      const response = await this.networkSecurity.secureRequest(
        "/api/settings",
        {
          method: "PUT",
          body: JSON.stringify(settings),
        }
      );

      console.log("SettingsPut: Settings updated successfully");
      return response;
    } catch (error: any) {
      console.error("Error in SettingsPut:", error);
      return this.handleApiError(error, "SettingsPut");
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
      const decryptedCredentials = await CredentialCryptoService.decryptCredentials(
        storedKeys.Credentials,
        {
          key: storedKeys.AESKey,
          iv: storedKeys.IV,
          algorithm: "AES-GCM",
          length: 256
        }
      );
      const userId = decryptedCredentials.userId;

      const response = await this.networkSecurity.secureRequest(
        `/api/keys?userId=${encodeURIComponent(userId)}`,
        {
          method: "GET",
        }
      );

      const data = await response.json();

      if (!storedKeys?.privateKey) {
        throw new Error("No private key found in stored credentials");
      }

      const privateKey = await BaseEncryptionService.Utils.importRSAPrivateKey(
        storedKeys.privateKey
      );

      if (!privateKey) {
        throw new Error("Failed to import private key");
      }

      const decryptedData = await BaseEncryptionService.Utils.decryptWithRSA(
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

  public static async KeysPost(data: {
    website: string;
    user: string;
    password: string;
  }): Promise<Response> {
    try {
      const storedKeys = await StoringService.Keys.getKeysFromStorage();
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
      const publicKey = await BaseEncryptionService.Utils.importRSAPublicKey(
        settings.settings.publicKey
      );
      const encryptedData = await BaseEncryptionService.Utils.encryptWithRSA(
        {
          website: data.website.trim(),
          user: data.user.trim(),
          password: data.password,
        },
        publicKey
      );

      return await this.networkSecurity.secureRequest("/api/keys", {
        method: "POST",
        body: JSON.stringify({
          id: uuidv4(),
          userId: storedKeys.Credentials.userId,
          ...encryptedData,
        }),
      });
    } catch (error: any) {
      return this.handleApiError(error, "PasswordsPost");
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
      const publicKey = await BaseEncryptionService.Utils.importRSAPublicKey(
        settings.settings.publicKey
      );
      const encryptedData = await BaseEncryptionService.Utils.encryptWithRSA(
        {
          website: data.website.trim(),
          user: data.user.trim(),
          password: data.password,
        },
        publicKey
      );

      return await this.networkSecurity.secureRequest(`/api/keys/${id}`, {
        method: "PUT",
        body: JSON.stringify({
          ...encryptedData,
          id,
          userId: storedKeys.Credentials.userId,
        }),
      });
    } catch (error: any) {
      return this.handleApiError(error, "KeysPut");
    }
  }

  public static async KeyDelete(id: string): Promise<Response> {
    try {
      console.log("PasswordDelete: Starting deletion for id:", id);
      const storedKeys = await StoringService.Keys.getKeysFromStorage();
      
      if (!storedKeys?.Credentials?.userId) {
        throw new Error("No user credentials found");
      }

      const response = await this.networkSecurity.secureRequest(
        `/api/keys?id=${encodeURIComponent(id)}`,
        {
          method: "DELETE",
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Delete failed: ${errorData.error || 'Unknown error'}`);
      }

      console.log("PasswordDelete: Successfully deleted password");
      return response;
    } catch (error) {
      console.error("PasswordDelete: Error occurred:", error);
      return this.handleApiError(error, "PasswordDelete");
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
    try {
      const storedKeys = await StoringService.Keys.getKeysFromStorage();
      const decryptedCredentials = await CredentialCryptoService.decryptCredentials(
        storedKeys.Credentials,
        {
          key: storedKeys.AESKey,
          iv: storedKeys.IV,
          algorithm: "AES-GCM",
          length: 256
        }
      );
      const userId = decryptedCredentials.userId;

      const response = await this.networkSecurity.secureRequest(
        `/api/passwords?userId=${encodeURIComponent(userId)}`,
        {
          method: "GET",
        }
      );

      const data = await response.json();

      if (!storedKeys?.privateKey) {
        throw new Error("No private key found in stored credentials");
      }

      const privateKey = await BaseEncryptionService.Utils.importRSAPrivateKey(
        storedKeys.privateKey
      );

      if (!privateKey) {
        throw new Error("Failed to import private key");
      }

      const decryptedData = await BaseEncryptionService.Utils.decryptWithRSA(
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
    try {
      const storedKeys = await StoringService.Keys.getKeysFromStorage();
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
      const publicKey = await BaseEncryptionService.Utils.importRSAPublicKey(
        settings.settings.publicKey
      );
      const encryptedData = await BaseEncryptionService.Utils.encryptWithRSA(
        {
          website: data.website.trim(),
          user: data.user.trim(),
          password: data.password,
        },
        publicKey
      );

      return await this.networkSecurity.secureRequest("/api/passwords", {
        method: "POST",
        body: JSON.stringify({
          id: uuidv4(),
          userId: storedKeys.Credentials.userId,
          ...encryptedData,
        }),
      });
    } catch (error: any) {
      return this.handleApiError(error, "PasswordsPost");
    }
  }

  public static async PasswordsPut(
    id: string,
    data: {
      website: string;
      user: string;
      password: string;
    }
  ): Promise<Response> {
    try {
      const storedKeys = await StoringService.Keys.getKeysFromStorage();
      if (!storedKeys?.Credentials?.userId) {
        throw new Error("No user credentials found");
      }
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
      const publicKey = await BaseEncryptionService.Utils.importRSAPublicKey(
        settings.settings.publicKey
      );
      const encryptedData = await BaseEncryptionService.Utils.encryptWithRSA(
        {
          website: data.website.trim(),
          user: data.user.trim(),
          password: data.password,
        },
        publicKey
      );

      const decryptedCredentials = await CredentialCryptoService.decryptCredentials(
        storedKeys.Credentials,
        {
          key: storedKeys.AESKey,
          iv: storedKeys.IV,
          algorithm: "AES-GCM",
          length: 256
        }
      );
      const userId = decryptedCredentials.userId;

      return await this.networkSecurity.secureRequest(`/api/passwords?userId=${encodeURIComponent(userId)}`, {
        method: "PUT",
        body: JSON.stringify({
          ...encryptedData,
          id,
        }),
      });
    } catch (error: any) {
      return this.handleApiError(error, "PasswordPut");
    }
  }

  public static async PasswordDelete(id: string): Promise<Response> {
    try {
      console.log("PasswordDelete: Starting deletion for id:", id);
      const storedKeys = await StoringService.Keys.getKeysFromStorage();
      
      if (!storedKeys?.Credentials?.userId) {
        throw new Error("No user credentials found");
      }

      const response = await this.networkSecurity.secureRequest(
        `/api/passwords?id=${encodeURIComponent(id)}`,
        {
          method: "DELETE",
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Delete failed: ${errorData.error || 'Unknown error'}`);
      }

      console.log("PasswordDelete: Successfully deleted password");
      return response;
    } catch (error) {
      console.error("PasswordDelete: Error occurred:", error);
      return this.handleApiError(error, "PasswordDelete");
    }
  }


}
