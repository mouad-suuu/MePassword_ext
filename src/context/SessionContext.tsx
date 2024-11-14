import React, { useState, useEffect } from "react";
import { KeyStorage } from "../services/storage/KeyStorage";
import { SessionSettings } from "../services/types";
import { SessionManagementService } from "../services/sessionManagment/SessionManager";
import SetupEntry from "../popup/components/setup/SetupEntry";
import PasswordPrompt from "../popup/components/setup/PasswordPrompt";

interface SessionProviderProps {
  children: React.ReactNode;
}

export const SessionProvider: React.FC<SessionProviderProps> = ({
  children,
}) => {
  const [sessionSettings, setSessionSettings] =
    useState<SessionSettings | null>(null);
  const [isPasswordValid, setIsPasswordValid] = useState(false);
  const [showSetup, setShowSetup] = useState(false);
  const [showPasswordPrompt, setShowPasswordPrompt] = useState(false);

  useEffect(() => {
    const initializeSession = async () => {
      try {
        const settings = await SessionManagementService.getSessionSettings();

        console.log("Settings:", settings);
        if (!settings || Object.keys(settings).length === 0) {
          setShowSetup(true);
        } else {
          setShowPasswordPrompt(true);
          setSessionSettings(settings);
        }
      } catch (error) {
        console.error("Error initializing session:", error);
        setShowSetup(true);
      }
    };

    initializeSession();
  }, []);

  return (
    <SessionContext.Provider value={{ sessionSettings, isPasswordValid }}>
      {showSetup && <SetupEntry />}
      {showPasswordPrompt && <PasswordPrompt />}
      {!showSetup && !showPasswordPrompt && isPasswordValid && children}
    </SessionContext.Provider>
  );
};

export const SessionContext = React.createContext<{
  sessionSettings: SessionSettings | null;
  isPasswordValid: boolean;
}>({
  sessionSettings: null,
  isPasswordValid: false,
});
