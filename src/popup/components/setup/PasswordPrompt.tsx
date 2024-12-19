import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../components/ui/card";
import { Input } from "../../components/ui/input";
import { Button } from "../../components/ui/button";
import { Lock } from "lucide-react";
import { WebAuthnService } from "../../../services/auth&security/WebAuthnService";
import { KeyStorage } from "../../../services/storage/KeyStorage";
import { UserButton } from "@clerk/chrome-extension";
import EncryptionService from "../../../services/EncryptionService";
import { SessionManagementService } from "../../../services/sessionManagment/SessionManager";
import StoringService from "../../../services/StorageService";
import { CryptoUtils } from "../../../services/Keys-managment/CryptoUtils";
import { useNavigate } from "react-router-dom";
import { SessionSettings } from "../../../services/types";

const PasswordPromptContent: React.FC = () => {
  const navigate = useNavigate();
  const [password, setPassword] = useState<string>("");
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [isBiometricAvailable, setIsBiometricAvailable] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  useEffect(() => {
    checkBiometricAvailability();
  }, []);

  const checkBiometricAvailability = async () => {
    try {
      const settings = await KeyStorage.getSettingsFromStorage();
      const isSupported = await WebAuthnService.isWebAuthnSupported();
      setIsBiometricAvailable(isSupported && settings.biometricVerification);
    } catch (error) {
      console.error("Error checking biometric availability:", error);
    }
  };

  const onPasswordVerified = async () => {
    try {
      const timestamp = Date.now();
      
      // Get the stored keys
      const storedKeys = await StoringService.Keys.getKeysFromStorage();
      const settings = await StoringService.Keys.getSettingsFromStorage();
      if (!storedKeys) {
        throw new Error("No stored keys found");
      }

      // Decrypt credentials to get the latest auth token
      const decryptedCredentials = await EncryptionService.CredentialCrypto.decryptCredentials(
        storedKeys.Credentials,
        {
          key: storedKeys.AESKey,
          iv: storedKeys.IV,
          algorithm: "AES-GCM",
          length: 256
        }
      );

      // Update session settings with all required fields
      await SessionManagementService.updateSessionSettings({
        autoLockStart: timestamp,
        lastAccessTime: timestamp,
        sessionStart: timestamp,
        sessionTime: settings.sessionTime,
        autoLockTime: settings.autoLockTime,
        sessionExpiry: settings.sessionExpiry,
        pushNotifications: settings.pushNotifications,
        biometricVerification: settings.biometricVerification,
        biometricType: settings.biometricType,
        biometricPassword: settings.biometricPassword,
        lockOnLeave: settings.lockOnLeave
      } as SessionSettings);

      // Re-encrypt the credentials with proper base64 encoding
      const key = await CryptoUtils.importAESKey(storedKeys.AESKey);
      const iv = CryptoUtils.base64ToBuffer(storedKeys.IV);

      const encryptedCredentials = {
        authToken: await CryptoUtils.encryptString(decryptedCredentials.authToken, key, iv),
        email: storedKeys.Credentials.email,
        username: storedKeys.Credentials.username,
        userId: await CryptoUtils.encryptString(decryptedCredentials.userId, key, iv),
        password: await CryptoUtils.encryptString(decryptedCredentials.password, key, iv)
      };

      // Store the updated credentials
      await StoringService.Keys.storeKeys({
        ...storedKeys,
        Credentials: encryptedCredentials
      });

      // Clear any error messages
      setErrorMessage("");

      // Navigate to the main vault page
      navigate("/vault");
    } catch (error) {
      console.error("Error updating session:", error);
      setErrorMessage("Error updating session");
    }
  };

  const handleBiometricAuth = async () => {
    try {
      setIsLoading(true);
      const isValid = await WebAuthnService.verifyBiometric();
      if (isValid) {
        await onPasswordVerified();
      } else {
        setErrorMessage("Biometric verification failed");
      }
    } catch (error) {
      console.error("Biometric authentication error:", error);
      setErrorMessage("Biometric authentication failed");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage("");

    try {
      const storedKeys = await StoringService.Keys.getKeysFromStorage();
      if (!storedKeys) {
        throw new Error("No stored keys found");
      }

      const key = await CryptoUtils.importAESKey(storedKeys.AESKey);
      const iv = CryptoUtils.base64ToBuffer(storedKeys.IV);

      const encryptedPassword = await CryptoUtils.encryptString(password, key, iv);

      const isValid = await EncryptionService.API.validatePassword(password);

      if (isValid) {
        await onPasswordVerified();
      } else {
        setErrorMessage("Invalid password");
      }
    } catch (error) {
      console.error("Password validation error:", error);
      setErrorMessage("Error validating password");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative flex min-w-[350px] h-[450px] items-center justify-center bg-background p-4">
      <div className="absolute top-4 right-4">
        <UserButton afterSignOutUrl="/" />
      </div>
      <Card className="w-[350px]">
        <CardHeader className="pb-2 pt-4">
          <CardTitle>Enter Master Password</CardTitle>
          <CardDescription>Unlock your password vault</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Input
                type="password"
                placeholder="Enter your master password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={isLoading}
                className="w-full"
              />
              {errorMessage && (
                <p className="text-sm text-red-500">{errorMessage}</p>
              )}
            </div>
            <div className="space-y-2">
              <Button 
                type="submit" 
                className="w-full"
                disabled={isLoading}
              >
                <Lock className="mr-2 h-4 w-4" />
                {isLoading ? "Verifying..." : "Unlock"}
              </Button>
              {isBiometricAvailable && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleBiometricAuth}
                  disabled={isLoading}
                  className="w-full"
                >
                  {isLoading ? "Verifying..." : "Use Biometric"}
                </Button>
              )}
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

const PasswordPrompt: React.FC = () => {
  return <PasswordPromptContent />;
};

export default PasswordPrompt;