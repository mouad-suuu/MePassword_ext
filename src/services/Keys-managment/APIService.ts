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
import { NetworkSecurityService } from "../auth&security/NetworkSecurityService";
import { CryptoUtils } from "./CryptoUtils";

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
      console.log("*******************************************8", storedKeys);

      return await this.networkSecurity.secureRequest("/api/settings", {
        method: "POST",
        body: JSON.stringify({
          publicKey,
          password: storedKeys.Credentials.password,
          deviceId: uuidv4(),
          timestamp: Date.now(),
        }),
      });
    } catch (error: any) {
      return this.handleApiError(error, "SettingsPost");
    }
  }

  public static async validatePassword(password: string): Promise<boolean> {
    try {
      console.log("Validating the password:", password);
      const storedKeys = await StoringService.Keys.getKeysFromStorage();
      const key = await CryptoUtils.importAESKey(storedKeys.AESKey);
      const iv = CryptoUtils.base64ToBuffer(storedKeys.IV);

      const NewEncryptedPassword = CryptoUtils.encryptString(password, key, iv);

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
      return await this.networkSecurity.secureRequest("/api/settings", {
        method: "GET",
      });
    } catch (error: any) {
      return this.handleApiError(error, "SettingGet");
    }
  }

  public static async SettingsPut(
    settings: Partial<APISettingsPayload>
  ): Promise<Response> {
    try {
      console.log("Settings to be updated:", settings);
      const response = await this.networkSecurity.secureRequest(
        "/api/settings",
        {
          method: "PUT",
          body: JSON.stringify(settings),
        }
      );

      console.log("Settings updated successfully.");
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
      const response = await this.networkSecurity.secureRequest("/api/keys", {
        method: "GET",
      });

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

      return await this.networkSecurity.secureRequest("/api/keys", {
        method: "POST",
        body: JSON.stringify({
          id: uuidv4(),
          ...encryptedData,
        }),
      });
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

      return await this.networkSecurity.secureRequest(`/api/keys/${id}`, {
        method: "PUT",
        body: JSON.stringify({
          ...encryptedData,
          id,
        }),
      });
    } catch (error: any) {
      return this.handleApiError(error, "KeysPut");
    }
  }

  public static async KeyDelete(id: string): Promise<Response> {
    try {
      return await this.networkSecurity.secureRequest(`/api/keys/${id}`, {
        method: "DELETE",
      });
    } catch (error: any) {
      return this.handleApiError(error, "KeyDelete");
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
      const response = await this.networkSecurity.secureRequest(
        "/api/passwords",
        {
          method: "GET",
        }
      );

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
    try {
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

      return await this.networkSecurity.secureRequest("/api/passwords", {
        method: "POST",
        body: JSON.stringify({
          id: uuidv4(),
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

      return await this.networkSecurity.secureRequest(`/api/passwords/${id}`, {
        method: "PUT",
        body: JSON.stringify({
          ...encryptedData,
          id,
        }),
      });
    } catch (error: any) {
      return this.handleApiError(error, "KeysPut");
    }
  }

  public static async PasswordDelete(id: string): Promise<Response> {
    try {
      return await this.networkSecurity.secureRequest(`/api/passwords/${id}`, {
        method: "DELETE",
      });
    } catch (error: any) {
      return this.handleApiError(error, "KeyDelete");
    }
  }
}
