import React, { useState, useEffect, useContext } from "react";
import { SessionManagementService } from "../services/sessionManagment/SessionManager";
import SetupEntry from "../popup/components/setup/SetupEntry";
import PasswordPrompt from "../popup/components/setup/PasswordPrompt";
import { SessionSettings } from "../services/types";
import { KeyStorage } from "../services/storage/KeyStorage";
import Main from "../popup/components/main";
import StorageService from "../services/StorageService";

interface SessionProviderProps {
  children: React.ReactNode;
}

export const SessionContext = React.createContext<{
  sessionSettings: SessionSettings | null;
  isPasswordValid: boolean;
  handlePasswordValidation: () => void;
  handleLogout: () => void;
}>({
  sessionSettings: null,
  isPasswordValid: false,
  handlePasswordValidation: () => {},
  handleLogout: () => {},
});

export const SessionProvider: React.FC<SessionProviderProps> = ({
  children,
}) => {
  const [sessionSettings, setSessionSettings] =
    useState<SessionSettings | null>(null);
  const [isPasswordValid, setIsPasswordValid] = useState(false);
  const [showSetup, setShowSetup] = useState(false);
  const [showPasswordPrompt, setShowPasswordPrompt] = useState(false);
  const [isLockTimeOn, setIsLockTimeOn] = useState(false);
  const sessionManagementService = new SessionManagementService();

  useEffect(() => {
    const checkSession = async () => {
      try {
        console.log("Checking session status...");
        const settings = await KeyStorage.getSettingsFromStorage();

        if (!settings || Object.keys(settings).length === 0) {
          console.log("No settings found - new setup required");
          setShowSetup(true);
          return;
        }

        const isSessionExpired =
          await sessionManagementService.checkSessionExpiration();
        if (isSessionExpired) {
          console.log("Session expired, clearing storage");
          StorageService.Storage.clearStorage();
          setShowSetup(true);
          return;
        }

        setSessionSettings(settings);
        const isShortLockActive =
          await sessionManagementService.checkShortLockExpiration();
        if (isShortLockActive) {
          console.log("Short lock is active");
          setIsLockTimeOn(true);
          setShowPasswordPrompt(false);
        } else {
          console.log("Short lock expired, showing password prompt");
          setShowPasswordPrompt(true);
        }
      } catch (error) {
        console.error("Error in session check:", error);
        setShowSetup(true);
      }
    };

    checkSession();
  }, []);

  useEffect(() => {
    if (!sessionSettings || !isPasswordValid) return;

    const interval = setInterval(async () => {
      const isShortLockExpired =
        await sessionManagementService.checkShortLockExpiration();
      if (isShortLockExpired) {
        setShowPasswordPrompt(true);
        setIsPasswordValid(false);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [sessionSettings, isPasswordValid]);

  const handlePasswordValidation = () => {
    setIsPasswordValid(true);
    sessionManagementService.startShortLockTimer();
    setShowPasswordPrompt(false);
  };

  const handleLogout = () => {
    sessionManagementService.endShortLock();
    // Perform other logout actions
  };

  return (
    <SessionContext.Provider
      value={{
        sessionSettings,
        isPasswordValid,
        handlePasswordValidation,
        handleLogout,
      }}
    >
      {showSetup && <SetupEntry />}
      {showPasswordPrompt && <PasswordPrompt />}
      {isLockTimeOn && !showPasswordPrompt && <Main />}
      {!showSetup && !showPasswordPrompt && isPasswordValid && children}
    </SessionContext.Provider>
  );
};
