import React, { useState, useCallback } from "react";
import { Upload, Plus, FileKey } from "lucide-react";
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
import EncryptionService from "../../../services/Keys-managment/Encrypt";
import StoringService from "../../../services/db";
import {
  KeySet,
  UserCredentials,
  EncryptedPassword,
} from "../../../services/types";

const StartupScreen = ({
  onKeysLoaded,
  onCreateAccount,
}: {
  onKeysLoaded: (keys: KeySet) => void;
  onCreateAccount: () => void;
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState("");

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    async (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      setIsDragging(false);
      setError("");

      const file = e.dataTransfer.files[0];
      if (!file) return;

      try {
        const text = await file.text();
        const keys = JSON.parse(text.split("---")[1]); // Extract keys between dashes
        await StoringService.storeKeys(keys);
        onKeysLoaded(keys);
      } catch (err) {
        setError("Invalid key file. Please try again.");
      }
    },
    [onKeysLoaded]
  );

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
          {error && (
            <Alert variant="destructive" className="mt-4">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </CardContent>
        <CardFooter>
          <Button onClick={onCreateAccount} className="w-full">
            <Plus className="mr-2 h-4 w-4" />
            Create New Account
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};

const CreateAccountForm = ({
  onAccountCreated,
}: {
  onAccountCreated: (keys: KeySet) => void;
}) => {
  const [formData, setFormData] = useState<UserCredentials>({
    website: "",
    authToken: "",
    password: "",
    notes: "", // Optional
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
        id: crypto.randomUUID(),
        version: 1,
        created: Date.now(),
        lastRotated: Date.now(),
        encryption: {
          publicKey: {
            key: "",
            algorithm: "RSA-OAEP",
            length: 4096,
            format: "spki",
          },
          privateKey: {
            key: "",
            algorithm: "RSA-OAEP",
            length: 4096,
            format: "pkcs8",
            protected: false,
          },
        },
        dataKey: {
          key: "",
          algorithm: "AES-GCM",
          length: 256,
          iv: "",
        },
      };

      const { rsaKeyPair, aesKey, formattedOutput } =
        await EncryptionService.generateKeyComponents();

      // Create and store session key
      const sessionKey = EncryptionService.generateSessionKey();
      EncryptionService.storeSessionData(sessionKey, aesKey, 1800000); // 30 minutes

      // Update the keys with generated values
      keys.encryption = rsaKeyPair;
      keys.dataKey = aesKey;

      // Encrypt credentials
      const { encryptedData, formattedOutput: encryptedOutput } =
        await EncryptionService.encryptCredentials(
          formData as UserCredentials & { password: string },
          keys.dataKey
        );

      // Send to API
      const apiResponse = await EncryptionService.prepareAndSendAPISettings(
        encryptedData as any,
        aesKey,
        rsaKeyPair.publicKey.key
      );

      if (!apiResponse.ok) {
        throw new Error("Failed to setup API settings");
      }

      // Store encrypted data and keys
      await StoringService.storeKeys(keys);
      await StoringService.storeEncryptedPassword(encryptedData as any);

      // Generate key file content with encrypted credentials
      const keyFileContent = `----------PRIVATEKEY----------------
${keys.encryption.privateKey.key}
----------PUBLICKEY----------------
${keys.encryption.publicKey.key}
----------AES-GCM------------------
${keys.dataKey.key}
----------IV----------------------
${keys.dataKey.iv}
----------ENCRYPTED-WEBSITE--------
${encryptedData.website}
----------ENCRYPTED-AUTH----------
${encryptedData.authToken}
----------METADATA----------------
${keys.id}|${keys.version}|${keys.created}|${keys.lastRotated}`;

      // Create and download key file
      const blob = new Blob([keyFileContent], { type: "text/plain" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "password-manager-keys.txt";
      a.click();
      URL.revokeObjectURL(url);

      // Clean up session data
      EncryptionService.clearSessionData(sessionKey);

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
                value={formData.website}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, website: e.target.value }))
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

  const handleKeysLoaded = (loadedKeys: KeySet) => {
    setKeys(loadedKeys);
    setStage("main");
  };

  const handleCreateAccount = () => {
    setStage("create");
  };

  const handleAccountCreated = (newKeys: any) => {
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
      return <div>Main app interface goes here</div>;
    default:
      return null;
  }
};

export default PasswordManager;
