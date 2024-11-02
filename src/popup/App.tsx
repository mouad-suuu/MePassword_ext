import React, { useState, useEffect } from "react";
import Navigation from "./components/Navigation";
import Passwords from "./components/Passwords";
import Keys from "./components/keys";
import Profile from "./components/profile";
import Settings from "./components/Settings";
import Setup from "./components/Setup";
import { Card } from "./components/ui/card";
import { useExtensionState } from "./hooks/useExtensionState";
import { ExtensionSettings } from "../services/types";
import CryptoManager from "../services/Keys-managment/CryptoManager";
import APIService from "../services/db";

// Add proper type definitions for your components
interface SetupProps {
  onSetupComplete: (settings: ExtensionSettings) => Promise<void>;
}

interface PasswordsProps {
  cryptoManager: CryptoManager;
  apiService: APIService;
}

interface KeysProps {
  cryptoManager: CryptoManager;
  apiService: APIService;
}

interface ProfileProps {
  settings: ExtensionSettings;
}

interface SettingsProps {
  settings: ExtensionSettings;
  onUpdateSettings: (newSettings: ExtensionSettings) => Promise<void>;
  onReset: () => Promise<void>;
}

const App = () => {
  const [activeTab, setActiveTab] = useState("passwords");
  const [state, actions] = useExtensionState();
  const [isSetupComplete, setIsSetupComplete] = useState<boolean | null>(null);
  const [settings, setSettings] = useState<ExtensionSettings | null>(null);
  useEffect(() => {
    checkSetupStatus();
  }, []);

  const checkSetupStatus = async () => {
    try {
      // Check if settings exist in storage
      const result = await chrome.storage.local.get([
        "extensionSettings",
        "setupComplete",
      ]);
      const storedSettings = result.extensionSettings as
        | ExtensionSettings
        | undefined;
      const setupComplete = result.setupComplete as boolean | undefined;

      if (storedSettings && setupComplete) {
        setSettings(storedSettings);
        setIsSetupComplete(true);
      } else {
        setIsSetupComplete(false);
      }
    } catch (error) {
      console.error("Failed to check setup status:", error);
      setIsSetupComplete(false);
    }
  };

  const handleSetupComplete = (newSettings: ExtensionSettings) => {
    setSettings(newSettings);
    setIsSetupComplete(true);
    setActiveTab("passwords");
  };
  // Show loading state while checking setup status
  if (state.isSetupComplete === null) {
    return (
      <Card className="min-w-[400px] min-h-96 bg-gray-50 border-gray-300">
        <div className="flex items-center justify-center h-96">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900" />
        </div>
      </Card>
    );
  }

  // Show setup if not complete
  if (!state.isSetupComplete) {
    return (
      <Card className="min-w-[400px] min-h-96 bg-gray-50 border-gray-300">
        <Setup
          onSetupComplete={async (settings: ExtensionSettings) => {
            await actions.updateSettings(settings);
            await actions.initializeServices();
          }}
        />
      </Card>
    );
  }

  return (
    <Card className="min-w-[400px] min-h-96 bg-gray-50 border-gray-300">
      <Navigation activeTab={activeTab} setActiveTab={setActiveTab} />

      <main className="p-4">
        {activeTab === "passwords" && (
          <Passwords
            cryptoManager={state.cryptoManager!}
            apiService={state.apiService!}
          />
        )}
        {activeTab === "keys" && (
          <Keys
            cryptoManager={state.cryptoManager!}
            apiService={state.apiService!}
          />
        )}
        {activeTab === "profile" && <Profile settings={state.settings!} />}
        {activeTab === "settings" && (
          <Settings
            settings={state.settings!}
            onUpdateSettings={actions.updateSettings}
            onReset={actions.resetState}
          />
        )}
      </main>
    </Card>
  );
};

export default App;
