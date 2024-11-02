import CryptoManager from "./Keys-managment/CryptoManager";
import { EncryptedPassword, ExtensionSettings } from "./types"; // Adjust the path as necessary

interface APIResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

interface InitializeAccountParams {
  publicKey: string;
  settings: ExtensionSettings;
}

class APIService {
  private readonly baseUrl: string;
  private readonly cryptoManager: CryptoManager;

  constructor(baseUrl: string, cryptoManager: CryptoManager) {
    this.baseUrl = baseUrl;
    this.cryptoManager = cryptoManager;
  }

  private async fetchWithAuth<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<APIResponse<T>> {
    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        ...options,
        headers: {
          ...options.headers,
          "Content-Type": "application/json",
          Authorization: await this.getAuthHeader(),
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return { success: true, data };
    } catch (error) {
      console.error("API request failed:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }
  public async initializeAccount(
    params: InitializeAccountParams
  ): Promise<void> {
    try {
      // Make API call to initialize account
      await this.fetchWithAuth("/account/initialize", {
        method: "POST",
        body: JSON.stringify(params),
      });
    } catch (error) {
      console.error("Failed to initialize account:", error);
      throw new Error("Account initialization failed");
    }
  }
  private async getAuthHeader(): Promise<string> {
    // Implement authentication token generation
    // This should use the authKey from CryptoManager
    return "Bearer token";
  }

  public async syncPasswords(
    passwords: EncryptedPassword[]
  ): Promise<APIResponse<void>> {
    return this.fetchWithAuth("/api/passwords", {
      method: "POST",
      body: JSON.stringify({ passwords }),
    });
  }

  public async getPasswords(): Promise<APIResponse<EncryptedPassword[]>> {
    return this.fetchWithAuth("/api/passwords");
  }

  public async updatePassword(
    id: string,
    password: EncryptedPassword
  ): Promise<APIResponse<void>> {
    return this.fetchWithAuth(`/api/passwords/${id}`, {
      method: "PUT",
      body: JSON.stringify(password),
    });
  }

  public async deletePassword(id: string): Promise<APIResponse<void>> {
    return this.fetchWithAuth(`/api/passwords/${id}`, {
      method: "DELETE",
    });
  }
}

export default APIService;
