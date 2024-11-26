import React, { useState, useEffect } from "react";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import { SessionManagementService } from "../../../services/sessionManagment/SessionManager";
import EncryptionService from "../../../services/EncryptionService";
import Main from "../main";
import { Lock, Key, AlertCircle, Fingerprint } from "lucide-react";
import { KeyStorage } from "../../../services/storage/KeyStorage";
import { WebAuthnService } from "../../../services/auth&security/WebAuthnService";

export const PasswordPrompt: React.FC = () => {
  const [password, setPassword] = useState<string>("");
  const [isValid, setIsValid] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [isBiometricAvailable, setIsBiometricAvailable] =
    useState<boolean>(false);

  useEffect(() => {
    checkBiometricAvailability();
  }, []);

  const checkBiometricAvailability = async () => {
    try {
      console.log("Checking biometric availability...");
      const settings = await KeyStorage.getSettingsFromStorage();
      console.log("Current settings:", settings);

      const isSupported = await WebAuthnService.isWebAuthnSupported();
      console.log("WebAuthn supported:", isSupported);

      setIsBiometricAvailable(isSupported && settings.biometricVerification);
      console.log(
        "Biometric available:",
        isSupported && settings.biometricVerification
      );
    } catch (error) {
      console.error("Error checking biometric availability:", error);
    }
  };

  const handleBiometricAuth = async () => {
    try {
      console.log("Starting biometric authentication...");
      const isValid = await WebAuthnService.verifyBiometric();
      console.log("Biometric verification result:", isValid);

      if (isValid) {
        console.log("Biometric authentication successful");
        await KeyStorage.updateSettings({
          autoLockStart: Date.now(),
        });
        setIsValid(true);
      } else {
        console.log("Biometric verification failed");
        setErrorMessage("Biometric verification failed");
      }
      const responce = await EncryptionService.API.SettingGet();
      const settings = await responce.json();
      //   await SessionManagementService.initialize(password);
      await KeyStorage.updateSettings({
        autoLockStart: Date.now(),
        autoLockTime: settings.settings.sessionSettings.autoLockTime,
      });
      console.log("Settings updated:", settings);
    } catch (error) {
      console.error("Biometric authentication error:", error);
      setErrorMessage("Biometric authentication error. Please use password.");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await handleValidatePassword(password);
  };

  const handleValidatePassword = async (password: string) => {
    const valid = await EncryptionService.API.validatePassword(password);
    if (valid) {
      const responce = await EncryptionService.API.SettingGet();
      const settings = await responce.json();
      //   await SessionManagementService.initialize(password);
      await KeyStorage.updateSettings({
        autoLockStart: Date.now(),
        autoLockTime: settings.settings.sessionSettings.autoLockTime,
      });
      console.log("Settings updated:", settings);
      setIsValid(true);
    } else {
      setErrorMessage("Invalid password. Please try again.");
      setPassword("");
    }
  };

  return (
    <>
      {!isValid ? (
        <div className="min-w-[400px] min-h-96 bg-gray-50 flex flex-col items-center justify-center p-8">
          {isBiometricAvailable && (
            <Button
              onClick={handleBiometricAuth}
              className="mb-4 flex items-center gap-2"
            >
              <Fingerprint className="w-5 h-5" />
              Use Biometric Login
            </Button>
          )}

          <div className="mb-6 text-primary">
            <Lock size={48} className="mx-auto mb-2" />
          </div>

          <h2 className="text-2xl font-semibold text-gray-800 mb-6 text-center">
            Welcome Back
          </h2>

          {errorMessage && (
            <div className="flex items-center gap-2 text-red-500 mb-6 bg-red-50 p-3 rounded-lg w-full">
              <AlertCircle size={18} />
              <span>{errorMessage}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="w-full space-y-4">
            <div className="relative">
              <Key
                className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                size={18}
              />
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="pl-10 py-5"
                placeholder="Enter your password"
              />
            </div>

            <Button type="submit" className="w-full py-5 text-base font-medium">
              Unlock
            </Button>
          </form>
        </div>
      ) : (
        <Main />
      )}
    </>
  );
};
export default PasswordPrompt;
