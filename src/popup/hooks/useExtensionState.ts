import { useState, useEffect } from "react";
import { ExtensionSettings, KeySet } from "../../services/types";
import CryptoManager from "../../services/Keys-managment/CryptoManager";
import APIService from "../../services/db";

interface ExtensionState {
  settings: ExtensionSettings | null;
  isSetupComplete: boolean | null;
  cryptoManager: CryptoManager | null;
  apiService: APIService | null;
}

interface ExtensionStateActions {
  updateSettings: (newSettings: ExtensionSettings) => Promise<void>;
  resetState: () => Promise<void>;
  initializeServices: () => Promise<void>;
}

export function useExtensionState(): [ExtensionState, ExtensionStateActions] {
  const [state, setState] = useState<ExtensionState>({
    settings: null,
    isSetupComplete: null,
    cryptoManager: null,
    apiService: null,
  });

  useEffect(() => {
    loadState();
  }, []);

  const loadState = async () => {
    try {
      const result = await chrome.storage.local.get([
        "extensionSettings",
        "setupComplete",
      ]);
      const settings = result.extensionSettings as
        | ExtensionSettings
        | undefined;
      const setupComplete = result.setupComplete as boolean | undefined;

      if (settings && setupComplete) {
        const cryptoManager = new CryptoManager();
        await cryptoManager.initializeKeys();

        const apiService = new APIService(settings.serverUrl, cryptoManager);

        setState({
          settings,
          isSetupComplete: true,
          cryptoManager,
          apiService,
        });
      } else {
        setState((prev) => ({
          ...prev,
          isSetupComplete: false,
        }));
      }
    } catch (error) {
      console.error("Failed to load extension state:", error);
      setState((prev) => ({
        ...prev,
        isSetupComplete: false,
      }));
    }
  };

  const updateSettings = async (newSettings: ExtensionSettings) => {
    try {
      await chrome.storage.local.set({ extensionSettings: newSettings });

      // If server URL changed, reinitialize API service
      if (newSettings.serverUrl !== state.settings?.serverUrl) {
        const apiService = new APIService(
          newSettings.serverUrl,
          state.cryptoManager!
        );
        setState((prev) => ({
          ...prev,
          settings: newSettings,
          apiService,
        }));
      } else {
        setState((prev) => ({
          ...prev,
          settings: newSettings,
        }));
      }
    } catch (error) {
      console.error("Failed to update settings:", error);
      throw new Error("Failed to update settings");
    }
  };

  const resetState = async () => {
    try {
      await chrome.storage.local.clear();
      setState({
        settings: null,
        isSetupComplete: false,
        cryptoManager: null,
        apiService: null,
      });
    } catch (error) {
      console.error("Failed to reset state:", error);
      throw new Error("Failed to reset state");
    }
  };

  const initializeServices = async () => {
    if (!state.settings) return;

    try {
      const cryptoManager = new CryptoManager();
      await cryptoManager.initializeKeys();

      const apiService = new APIService(
        state.settings.serverUrl,
        cryptoManager
      );

      setState((prev) => ({
        ...prev,
        cryptoManager,
        apiService,
      }));
    } catch (error) {
      console.error("Failed to initialize services:", error);
      throw new Error("Failed to initialize services");
    }
  };

  return [
    state,
    {
      updateSettings,
      resetState,
      initializeServices,
    },
  ];
}
