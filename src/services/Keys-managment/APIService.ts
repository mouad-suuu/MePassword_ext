import {
  APISettingsPayload,
  NewEncryptedPassword,
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
      const storedKeys = await StoringService.Keys.getKeysFromStorage();

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

      if (!decryptedCredentials.userId) {
        throw new Error("User ID not found in credentials");
      }
      const key = await CryptoUtils.importAESKey(storedKeys.AESKey);
      const iv = CryptoUtils.base64ToBuffer(storedKeys.IV);

      // Encrypt the password
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
      return this.handleApiError(error, "SettingsPost");
    }
  }

  public static async validatePassword(password: string): Promise<boolean> {
    try {
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
      return jsonResponse.isValid;
    } catch (error: any) {
      return this.handleApiError(error, "SettingsPost");
    }
  }

  public static async SettingGet(): Promise<Response> {
    try {
      const storedKeys = await StoringService.Keys.getKeysFromStorage();
      
      if (!storedKeys || !storedKeys.Credentials) {
        console.error("SettingGet: No stored credentials found");
        throw new Error("No stored credentials found");
      }
      
      const result = await CredentialCryptoService.decryptCredentials(
        storedKeys.Credentials,
        {
          key: storedKeys.AESKey,
          iv: storedKeys.IV,
          algorithm: "AES-GCM",
          length: 256
        }
      );

      const userId = result.userId || "";

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

      const response = await this.networkSecurity.secureRequest(
        "/api/settings",
        {
          method: "PUT",
          body: JSON.stringify(settings),
        }
      );

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
      owner_email: string;
      updated_at?: string;
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
        owner_email: data.passwords[index].owner_email,
        updated_at: data.passwords[index].updated_at,
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
      owner_email: string;
      updated_at?: string;
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

      const mappedPasswords = data.passwords.map((item: NewEncryptedPassword, index: number) => {
        return {
          id: item.id,
          website: decryptedData[index].website,
          user: decryptedData[index].user,
          password: decryptedData[index].password,
          encrypted_password: item.encrypted_password,
          owner_email: item.owner_email,
          owner_id: item.owner_id,
          updated_at: item.updated_at,
          MetaData: item.MetaData
        };
      });

      return mappedPasswords;
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

      return response;
    } catch (error) {
      console.error("PasswordDelete: Error occurred:", error);
      return this.handleApiError(error, "PasswordDelete");
    }
  }

  public static async SearchUsers(email: string): Promise<Response> {
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

      return await this.networkSecurity.secureRequest(
        `/api/users/search?email=${encodeURIComponent(email)}&userId=${encodeURIComponent(userId)}`,
        {
          method: "GET",
        }
      );
    } catch (error: any) {
      return this.handleApiError(error, "SearchUsers");
    }
  }

  public static async ShareItems(data: {
    recipientEmail: string;
    items: {
      id: string;
      website: string;
      user: string;
      password: string;
    }[];
    type: 'passwords' | 'keys';
  }): Promise<Response> {
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

      // Get recipient's public key
      const recipientKeyResponse = await this.networkSecurity.secureRequest(
        `/api/users/search?email=${encodeURIComponent(data.recipientEmail)}&userId=${encodeURIComponent(userId)}`,
        {
          method: "GET",
        }
      );

      if (!recipientKeyResponse.ok) {
        throw new Error('Failed to get recipient information');
      }

      const recipientData = await recipientKeyResponse.json();
      if (!recipientData || recipientData.length === 0) {
        throw new Error('Recipient not found');
      }

      // Get recipient's settings to get their public key
      const recipientSettings = await this.networkSecurity.secureRequest(
        `/api/settings?userId=${encodeURIComponent(recipientData[0].id)}`,
        {
          method: "GET",
        }
      );

      if (!recipientSettings.ok) {
        throw new Error('Failed to get recipient settings');
      }

      const settings = await recipientSettings.json();
      if (!settings?.settings?.publicKey) {
        throw new Error('Recipient has not set up their encryption keys');
      }

      // Import recipient's public key
      const recipientPublicKey = await BaseEncryptionService.Utils.importRSAPublicKey(
        settings.settings.publicKey
      );

      // Encrypt items with recipient's public key
      const encryptedItems = await Promise.all(
        data.items.map(async (item) => {
          const encryptedData = await BaseEncryptionService.Utils.encryptWithRSA(
            {
              website: item.website,
              user: item.user,
              password: item.password
            },
            recipientPublicKey
          );

          return {
            id: item.id,
            website: encryptedData.website,
            user: encryptedData.user,
            encrypted_password: encryptedData.password,  
            owner_email: decryptedCredentials.email
          };
        })
      );

      // Share the encrypted items
      const response = await this.networkSecurity.secureRequest(
        `/api/share?userId=${encodeURIComponent(userId)}`,
        {
          method: "POST",
          body: JSON.stringify({
            recipientEmail: data.recipientEmail,
            items: encryptedItems,
            type: data.type
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to share items');
      }

      return response;
    } catch (error: any) {
      return this.handleApiError(error, "ShareItems");
    }
  }
}
