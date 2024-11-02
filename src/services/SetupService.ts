import { KeySet, InitialSetupData, ExtensionSettings } from "./types";
import CryptoManager from "./Keys-managment/CryptoManager";
import APIService from "./db";

class SetupService {
  private cryptoManager: CryptoManager;
  private apiService: APIService | null = null;

  constructor() {
    this.cryptoManager = new CryptoManager();
  }

  public async importKeys(keyFile: File): Promise<boolean> {
    try {
      const keyData = await this.readKeyFile(keyFile);
      await this.cryptoManager.importKey(keyData as any);
      return true;
    } catch (error) {
      console.error("Failed to import keys:", error);
      return false;
    }
  }

  public async initiateNewSetup(setupData: InitialSetupData): Promise<{
    keys: KeySet;
    downloadUrl: string;
  }> {
    try {
      // Generate new keys
      const keys = await this.cryptoManager.generateNewKeys();

      // Initialize API service with the new URL
      this.apiService = new APIService(
        setupData.deployedAppUrl,
        this.cryptoManager
      );

      // Create settings object
      const settings: ExtensionSettings = {
        serverUrl: setupData.deployedAppUrl,
        authToken: setupData.authKey,
        dataRetentionTime: 5, // Default 5 minutes
        useBiometricAuth: false,
        theme: "light",
        autoFill: true,
      };

      // Save settings
      await this.saveSettings(settings);

      // Send public key and settings to server
      await this.apiService.initializeAccount({
        publicKey: keys.rsaPublicKey,
        settings,
      });

      // Generate key file download URL
      const downloadUrl = this.generateKeyFileDownload(keys);

      return { keys, downloadUrl };
    } catch (error) {
      console.error("Setup failed:", error);
      throw new Error("Failed to complete setup");
    }
  }

  private async readKeyFile(file: File): Promise<KeySet> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const keyData = JSON.parse(e.target?.result as string);
          resolve(keyData as KeySet);
        } catch (error) {
          reject(new Error("Invalid key file format"));
        }
      };
      reader.onerror = () => reject(new Error("Failed to read key file"));
      reader.readAsText(file);
    });
  }

  private generateKeyFileDownload(keys: KeySet): string {
    const keyFileContent = JSON.stringify(keys, null, 2);
    const blob = new Blob([keyFileContent], { type: "application/json" });
    return URL.createObjectURL(blob);
  }

  private async saveSettings(settings: ExtensionSettings): Promise<void> {
    await chrome.storage.local.set({ extensionSettings: settings });
  }
}

export default SetupService;
