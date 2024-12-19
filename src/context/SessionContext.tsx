import React, { useState, useEffect, useContext } from "react";
import { SessionManagementService } from "../services/sessionManagment/SessionManager";
import PasswordPrompt from "../popup/components/setup/PasswordPrompt";
import { SessionSettings } from "../services/types";
import { KeyStorage } from "../services/storage/KeyStorage";
import Main from "../popup/components/main";
import StorageService from "../services/StorageService";
import { useNavigate } from "react-router-dom";
import { AppRoutes } from "../popup/routes";
import { ClerkProvider, useAuth, useUser } from "@clerk/chrome-extension";

interface SessionProviderProps {
  children: React.ReactNode;
}

export const SessionContext = React.createContext<{
  sessionSettings: SessionSettings | null;
  isPasswordValid: boolean;
  handlePasswordValidation: () => void;
  handleLogout: () => void;
  signOut: () => void;
}>({
  sessionSettings: null,
  isPasswordValid: false,
  handlePasswordValidation: () => {},
  handleLogout: () => {},
  signOut: () => {},
});

export const SessionProvider: React.FC<SessionProviderProps> = ({
  children,
}) => {
  const navigate = useNavigate();
  const { isSignedIn, isLoaded, signOut } = useAuth();
  const { user } = useUser();
  const [sessionSettings, setSessionSettings] = useState<SessionSettings | null>(null);
  const [isPasswordValid, setIsPasswordValid] = useState(false);
  const [isLockTimeOn, setIsLockTimeOn] = useState(false);
  const sessionManagementService = new SessionManagementService();

  useEffect(() => {
    const checkSession = async () => {
      try {
        if (!isLoaded) return;

        const isAuthRoute = [
          AppRoutes.LOGIN,
          '/',
        ].includes(window.location.pathname as any);

        if (!isSignedIn || !user) {
          if (!isAuthRoute) {
            navigate(AppRoutes.LOGIN);
          }
          return;
        }

        const settings = await KeyStorage.getSettingsFromStorage();

        if (!settings || Object.keys(settings).length === 0) {
          navigate(AppRoutes.SETUP);
          return;
        }

        const isSessionExpired = await sessionManagementService.checkSessionExpiration();
        if (isSessionExpired) {
          await StorageService.SecureStorage.clearAllData();
          navigate(AppRoutes.SETUP);
          return;
        }

        setSessionSettings(settings);
        const isShortLockActive = await sessionManagementService.checkShortLockExpiration();
        
        if (isShortLockActive) {
          setIsLockTimeOn(true);
          setIsPasswordValid(true);
          navigate(AppRoutes.MAIN);
        } else {
          setIsLockTimeOn(false);
          setIsPasswordValid(false);
          navigate(AppRoutes.PASSWORDPROMPT);
        }
      } catch (error) {
        await StorageService.SecureStorage.clearAllData();
        navigate(AppRoutes.LOGIN);
      }
    };

    checkSession();
  }, [isLoaded, isSignedIn, user, navigate]);

  useEffect(() => {
    if (!sessionSettings || !isPasswordValid) return;

    const lockDuration = sessionSettings.autoLockTime || 5 * 60 * 1000;
    
    const timeout = setTimeout(async () => {
      const isShortLockExpired = await sessionManagementService.checkShortLockExpiration();
      if (isShortLockExpired) {
        setIsLockTimeOn(false);
        setIsPasswordValid(false);
        navigate(AppRoutes.PASSWORDPROMPT);
      }
    }, lockDuration);

    return () => clearTimeout(timeout);
  }, [sessionSettings, isPasswordValid, navigate]);

  const handlePasswordValidation = () => {
    setIsPasswordValid(true);
    setIsLockTimeOn(true);
    sessionManagementService.startShortLockTimer();
    navigate(AppRoutes.MAIN);
  };

  const handleLogout = async () => {
    try {
      sessionManagementService.endShortLock();
      await StorageService.SecureStorage.clearAllData();
      setSessionSettings(null);
      setIsPasswordValid(false);
      setIsLockTimeOn(false);
      navigate(AppRoutes.LOGIN);
    } catch (error) {
      navigate(AppRoutes.LOGIN);
    }
  };

  const handleSignOut = async () => {
    try {
      await SessionManagementService.clearSession();
      await signOut();
      navigate(AppRoutes.LOGIN);
    } catch (error) {
      navigate(AppRoutes.LOGIN);
    }
  };

  useEffect(() => {
    if (isLoaded && !isSignedIn) {
      SessionManagementService.clearSession();
    }
  }, [isLoaded, isSignedIn]);

  const value = {
    sessionSettings,
    isPasswordValid,
    handlePasswordValidation,
    handleLogout,
    signOut: handleSignOut,
  };

  return (
    <SessionContext.Provider value={value}>
      {children}
    </SessionContext.Provider>
  );
};
