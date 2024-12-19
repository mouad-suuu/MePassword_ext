import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../components/ui/card";
import { Input } from "../../components/ui/input";
import { Button } from "../../components/ui/button";
import { Lock, Fingerprint, Key, Shield } from "lucide-react";
import { WebAuthnService } from "../../../services/auth&security/WebAuthnService";
import { KeyStorage } from "../../../services/storage/KeyStorage";
import { UserButton } from "@clerk/chrome-extension";
import EncryptionService from "../../../services/EncryptionService";
import { SessionManagementService } from "../../../services/sessionManagment/SessionManager";
import StoringService from "../../../services/StorageService";
import { CryptoUtils } from "../../../services/Keys-managment/CryptoUtils";
import { useNavigate } from "react-router-dom";
import { SessionSettings } from "../../../services/types";
import { Logo } from "../Logo";

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
          <div className="flex flex-col items-center text-center">
            <div className="p-3 bg-blue-100 rounded-full mb-4">
              <Logo size="medium" />
            </div>
            <CardTitle className="text-2xl font-bold">Welcome Back!</CardTitle>
            <CardDescription className="text-gray-600 mt-2">
              Securely access your vault with your master password or biometric authentication
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
        
            <div className="space-y-2">
              <div className="relative">
                <Input
                  type="password"
                  placeholder="Enter your master password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={isLoading}
                  className="w-full pl-10 py-6"
                />
                <Key className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              </div>
              {errorMessage && (
                <p className="text-sm text-red-500 flex items-center gap-2">
                  <span className="inline-block w-2 h-2 bg-red-500 rounded-full"></span>
                  {errorMessage}
                </p>
              )}
            </div>
            
            <div className="flex items-center gap-3">
              <Button 
                type="submit" 
                className="flex-1 py-6 transition-all duration-200 hover:scale-[0.99] bg-blue-600 hover:bg-blue-700"
                disabled={isLoading}
              >
                <Lock className="mr-2 h-5 w-5" />
                {isLoading ? "Verifying..." : "Unlock"}
              </Button>
           
              {isBiometricAvailable && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleBiometricAuth}
                  disabled={isLoading}
                  className="w-12 h-12 rounded-full transition-all duration-200 hover:scale-[0.99] border-blue-600 hover:bg-blue-500 hover:border-blue-500 hover:text-white flex items-center justify-center p-0"
                >
                  <Fingerprint className="h-5 w-5 text-cyne-600 hover:text-white" />
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