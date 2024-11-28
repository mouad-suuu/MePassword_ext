import React, { useState, useCallback } from "react";
import { Upload, Plus, FileKey, Lock, AlertCircle, Key } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "../ui/card";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Alert, AlertDescription } from "../ui/alert";
import EncryptionService from "../../../services/EncryptionService";
import StoringService from "../../../services/StorageService";
import { KeySet, UserCredentials } from "../../../services/types";
import Main from "../main";
import { SessionManagementService } from "../../../services/sessionManagment/SessionManager";
import { KeyStorage } from "../../../services/storage/KeyStorage";
import { BackupSecurityService } from "../../../services/auth&security/BackupSecurityService";

const StartupScreen = ({
  onKeysLoaded,
  onCreateAccount,
}: {
  onKeysLoaded: (keys: KeySet) => void;
  onCreateAccount: () => void;
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState("");
  const [password, setPassword] = useState("");
  const [fileContent, setFileContent] = useState<KeySet | null>(null);
  const [showPasswordPrompt, setShowPasswordPrompt] = useState(false);

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleValidatePassword = async (password: string): Promise<boolean> => {
    try {
      const valid = await EncryptionService.API.validatePassword(password);
      if (valid) {
        await KeyStorage.updateSettings({
          autoLockStart: Date.now(),
        });
        return true;
      }
      return false;
    } catch (error) {
      console.error("Password validation error:", error);
      return false;
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    try {
      const backupService = BackupSecurityService.getInstance();
      const backupBlob = new Blob([JSON.stringify(fileContent)], {
        type: "application/json",
      });
      await backupService.restoreFromBackup(backupBlob, password);

      const keys = await StoringService.Keys.getKeysFromStorage();
      const response = await EncryptionService.API.SettingGet();
      const settings = await response.json();
      await SessionManagementService.updateSessionSettings(
        settings.sessionSettings
      );
      await SessionManagementService.initialize();
      onKeysLoaded(keys);
    } catch (err) {
      setError("Invalid password or corrupted backup file");
      setPassword("");
    }
  };

  const handleDrop = useCallback(async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    setError("");

    const file = e.dataTransfer.files[0];
    if (!file || !file.name.endsWith(".mpb")) {
      setError("Please provide a valid MePassword backup file");
      return;
    }

    try {
      const fileText = await file.text();
      const keySet = JSON.parse(fileText) as KeySet;
      setFileContent(keySet);
      setShowPasswordPrompt(true);
    } catch (err) {
      setError("Invalid backup file format");
    }
  }, []);

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <Card className="w-96">
        <CardHeader>
          <CardTitle>Password Manager</CardTitle>
          <CardDescription>
            Drop your key file or create a new account
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!showPasswordPrompt ? (
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                isDragging ? "border-blue-500 bg-blue-50" : "border-gray-300"
              }`}
            >
              <Upload className="mx-auto h-12 w-12 text-gray-400" />
              <p className="mt-2 text-sm text-gray-600">
                Drag and drop your key file here
              </p>
            </div>
          ) : (
            <form onSubmit={handlePasswordSubmit} className="space-y-4">
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
              <Button
                type="submit"
                className="w-full py-5 text-base font-medium"
              >
                <Lock className="mr-2 h-4 w-4" />
                Unlock
              </Button>
            </form>
          )}
          {error && (
            <Alert variant="destructive" className="mt-4">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </CardContent>
        {!showPasswordPrompt && (
          <CardFooter>
            <Button onClick={onCreateAccount} className="w-full">
              <Plus className="mr-2 h-4 w-4" />
              Create New Account
            </Button>
          </CardFooter>
        )}
      </Card>
    </div>
  );
};

const CreateAccountForm = ({
  onAccountCreated,
}: {
  onAccountCreated: (keys: KeySet) => void;
}) => {
  /**
   *  TODO: encrypt the cridentials before saving them
   *  TODO: send the password and public key to the server qith the settings
   * Done
   */
  const [formData, setFormData] = useState<UserCredentials>({
    server: "",
    authToken: "",
    password: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      // Generate key components with proper typing
      const keys: KeySet = {
        privateKey: "",
        AESKey: "",
        IV: "",
        Credentials: {
          server: "",
          authToken: "",
          password: "",
        },
      };

      // Generate encryption keys
      const { rsaKeyPair, aesKey } =
        await EncryptionService.KeyGeneration.generateKeyComponents();

      // Update keys with generated values
      keys.privateKey = rsaKeyPair.privateKey.key;
      keys.AESKey = aesKey.key;
      keys.IV = aesKey.iv;
      const encryptedCredentials =
        await EncryptionService.CredentialCrypto.encryptCredentials(
          formData,
          aesKey
        );
      keys.Credentials = encryptedCredentials.encryptedData;

      // Store keys and handle encryption
      await StoringService.Keys.storeKeys(keys);

      // Create backup using the user's password
      if (!formData.password) {
        throw new Error("Password is required");
      }
      const backupService = BackupSecurityService.getInstance();
      const backupBlob = await backupService.createSecureBackup(
        formData.password
      );

      // Download the backup file
      const url = URL.createObjectURL(backupBlob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "mepassword-backup.mpb"; // Custom extension
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      try {
        await EncryptionService.API.SettingsPost(rsaKeyPair.publicKey.key);
        await SessionManagementService.initialize();
      } catch (error) {
        console.error("Error sending settings to API:", error);
        throw new Error("Failed to send settings to server");
      }
      onAccountCreated(keys);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to create account. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <Card className="w-96">
        <CardHeader>
          <CardTitle>Create Account</CardTitle>
          <CardDescription>
            Enter your credentials to get started
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Input
                placeholder="Website"
                value={formData.server}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    server: e.target.value.endsWith("/")
                      ? e.target.value.slice(0, -1)
                      : e.target.value,
                  }))
                }
                required
              />
            </div>
            <div>
              <Input
                placeholder="Auth Token"
                value={formData.authToken}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    authToken: e.target.value,
                  }))
                }
                required
              />
            </div>
            <div>
              <Input
                type="password"
                placeholder="Password"
                value={formData.password}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, password: e.target.value }))
                }
                required
              />
            </div>
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            <Button type="submit" className="w-full" disabled={loading}>
              <FileKey className="mr-2 h-4 w-4" />
              {loading ? "Creating Account..." : "Create Account"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

const PasswordManager = () => {
  const [stage, setStage] = useState<"startup" | "create" | "main">("startup");
  const [keys, setKeys] = useState<KeySet | null>(null);

  const handleKeysLoaded = async (loadedKeys: KeySet) => {
    setKeys(loadedKeys);
    setStage("main");
  };

  const handleCreateAccount = () => {
    setStage("create");
  };

  const handleAccountCreated = async (newKeys: KeySet) => {
    setKeys(newKeys);
    setStage("main");
  };

  switch (stage) {
    case "startup":
      return (
        <StartupScreen
          onKeysLoaded={handleKeysLoaded}
          onCreateAccount={handleCreateAccount}
        />
      );
    case "create":
      return <CreateAccountForm onAccountCreated={handleAccountCreated} />;
    case "main":
      return <Main />;
    default:
      return null;
  }
};

export default PasswordManager;
