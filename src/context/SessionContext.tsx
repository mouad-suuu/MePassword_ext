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
        // First check if user is signed in with Clerk
        if (!isLoaded) return;

        // Don't redirect if we're already on login-related routes
        const isAuthRoute = [
          AppRoutes.LOGIN,
          '/',  // Also consider home route as auth route
        ].includes(window.location.pathname as any);

        if (!isSignedIn || !user) {
          if (!isAuthRoute) {
            console.log("No Clerk session - redirecting to login");
            navigate(AppRoutes.LOGIN);
          }
          return;
        }

        console.log("Checking session status...");
        const settings = await KeyStorage.getSettingsFromStorage();

        if (!settings || Object.keys(settings).length === 0) {
          console.log("No settings found - redirecting to key generation");
          navigate(AppRoutes.SETUP);
          return;
        }

        const isSessionExpired = await sessionManagementService.checkSessionExpiration();
        if (isSessionExpired) {
          console.log("Session expired, clearing storage");
          await StorageService.SecureStorage.clearAllData();
          navigate(AppRoutes.SETUP);
          return;
        }

        setSessionSettings(settings);
        const isShortLockActive = await sessionManagementService.checkShortLockExpiration();
        
        if (isShortLockActive) {
          console.log("Short lock is active - showing main");
          setIsLockTimeOn(true);
          setIsPasswordValid(true);
          navigate(AppRoutes.MAIN);
        } else {
          console.log("Short lock expired - showing password prompt");
          setIsLockTimeOn(false);
          setIsPasswordValid(false);
          navigate(AppRoutes.PASSWORDPROMPT);
        }
      } catch (error) {
        console.error("Error in session check:", error);
        navigate(AppRoutes.LOGIN);
      }
    };

    checkSession();
  }, [isLoaded, isSignedIn, user, navigate]);

  // Monitor short lock expiration
  useEffect(() => {
    if (!sessionSettings || !isPasswordValid) return;

    // Get the lock duration from settings (default to 5 minutes if not set)
    const lockDuration = sessionSettings.autoLockTime || 5 * 60 * 1000; // 5 minutes in milliseconds
    
    // Instead of checking every second, set a timeout for when the lock should expire
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
    sessionManagementService.endShortLock();
    await StorageService.SecureStorage.clearAllData();
    setSessionSettings(null);
    setIsPasswordValid(false);
    setIsLockTimeOn(false);
    navigate(AppRoutes.LOGIN);
  };

  const handleSignOut = async () => {
    try {
      await SessionManagementService.clearSession(); // Clear session data first
      await signOut();
      navigate(AppRoutes.LOGIN);
    } catch (error) {
      console.error("Error during sign out:", error);
    }
  };

  useEffect(() => {
    if (isLoaded && !isSignedIn) {
      SessionManagementService.clearSession(); // Also clear when auth state changes to signed out
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
