import React, { useState, useCallback, useEffect } from 'react';
import { Button } from "../../components/ui/button"
import { Input } from "../../components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "../../components/ui/card"
import { useAuth, UserButton, useUser } from "@clerk/chrome-extension";
import { Alert, AlertDescription } from "../../components/ui/alert";
import EncryptionService from "../../../services/EncryptionService";
import StoringService from "../../../services/StorageService";
import { KeySet, UserCredentials } from "../../../services/types";
import { SessionManagementService } from "../../../services/sessionManagment/SessionManager";
import { BackupSecurityService } from "../../../services/auth&security/BackupSecurityService";
import { FileKey, Upload, Plus, Lock, Key, RefreshCw } from "lucide-react";
import { SecureStorageService } from '../../../services/storage/WindowsHelloStorage';
import { useNavigate } from 'react-router-dom';
import { AppRoutes } from '../../routes';

const KeyGeneration: React.FC = () => {
  const { user } = useUser();
  const { getToken } = useAuth();
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [backupFile, setBackupFile] = useState<File | null>(null);
  const [hasExistingSettings, setHasExistingSettings] = useState<boolean | null>(null);
  const [formData, setFormData] = useState<UserCredentials>({
    userId: "",
    authToken: "",
    password: "",
    username: "",
    email: "",
  });

  useEffect(() => {
    const checkExistingSettings = async () => {
      try {
        if (!user) return;
        
        const authKey = await getToken();
        if (!authKey) {
          setHasExistingSettings(false);
          return;
        }

        const response = await fetch(`${process.env.REACT_APP_SERVER_URL}/api/settings?userId=${user.id}`, {
          method: 'HEAD',
          headers: {
            'x-user-id': user.id,
            'X-Request-Source': 'extension',
          }
        });

        // 200 means settings exist, 404 means they don't
        setHasExistingSettings(response.status === 200);
      } catch (error) {
        console.error('Error checking settings:', error);
        setHasExistingSettings(false);
      }
    };

    checkExistingSettings();
  }, [user, getToken]);

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    setError("");

    const file = e.dataTransfer.files[0];
    if (!file || !file.name.endsWith(".mpb")) {
      setError("Please provide a valid MePassword backup file");
      return;
    }

    setBackupFile(file);
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (!file.name.endsWith(".mpb")) {
        setError("Please provide a valid MePassword backup file");
        return;
      }
      setBackupFile(file);
    }
  };

  const handleRestoreBackup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      if (!backupFile || !password || !user) {
        throw new Error("Please select a backup file, enter your password, and ensure you're signed in");
      }

      const authKey = await getToken();
      if (!authKey) {
        throw new Error("Auth key not found. Please sign in again.");
      }

      const backupService = BackupSecurityService.getInstance();
      const restoredKeys = await backupService.restoreFromBackup(backupFile, password);

      const normalizedKeys = {
        AESKey: restoredKeys.AESKey || restoredKeys.AESKey,
        IV: restoredKeys.IV,
        Credentials: restoredKeys.Credentials || restoredKeys.Credentials,
        privateKey: restoredKeys.privateKey || restoredKeys.privateKey,
      };
      
      await StoringService.Keys.storeKeys(normalizedKeys);
      await SessionManagementService.initialize();

      const response = await EncryptionService.API.SettingGet();
      const settings = await response.json();
      
      if (settings?.sessionSettings) {
        await SessionManagementService.updateSessionSettings(settings.sessionSettings);
      }

      navigate(AppRoutes.MAIN);
    } catch (err) {
      console.error("Restore failed:", err);
      setError(err instanceof Error ? err.message : "Failed to restore backup");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateNewKeys = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    if (!user || !password) {
      setError("Please enter a password and ensure you're signed in.");
      setLoading(false);
      return;
    }

    try {
      const authKey = await getToken();
      if (!authKey) {
        throw new Error("Auth key not found. Please sign in again.");
      }

      const keys: KeySet = {
        privateKey: "",
        AESKey: "",
        IV: "",
        Credentials: {
          userId: user.id,
          authToken: authKey,
          password: password,
          username: user.fullName || "",
          email: user.primaryEmailAddress?.emailAddress || "",
        },
      };

      const { rsaKeyPair, aesKey } = await EncryptionService.KeyGeneration.generateKeyComponents();
      keys.privateKey = rsaKeyPair.privateKey.key;
      keys.AESKey = aesKey.key;
      keys.IV = aesKey.iv;

      const encryptedCredentials = await EncryptionService.CredentialCrypto.encryptCredentials(
        keys.Credentials,
        aesKey
      );
      keys.Credentials = {
        authToken: encryptedCredentials.encryptedData.authToken,
        email: user.primaryEmailAddress?.emailAddress || "",
        username: user.fullName || "",
        userId: encryptedCredentials.encryptedData.userId,
        password: encryptedCredentials.encryptedData.password
      };

      await SecureStorageService.storeKeys(keys);

      const backupService = BackupSecurityService.getInstance();
      const backupBlob = await backupService.createSecureBackup(password);
      const url = URL.createObjectURL(backupBlob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "mepassword-backup.mpb";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      await EncryptionService.API.SettingsPost(rsaKeyPair.publicKey.key);
      await SessionManagementService.initialize();
      navigate(AppRoutes.MAIN);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create keys");
    } finally {
      setLoading(false);
    }
  };

  if (hasExistingSettings === null) {
    return (
      <Card className="w-[380px] mx-auto">
        <CardContent className="pt-6">
          <div className="flex justify-center items-center h-32">
            <RefreshCw className="w-8 h-8 animate-spin text-blue-600" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-[380px] mx-auto">
      <CardHeader>
      <div className="absolute top-4 right-4">
        <UserButton afterSignOutUrl="/" />
      </div>
        <CardTitle>
          {hasExistingSettings ? 'Restore Your Account' : 'Create Encryption Keys'}
        </CardTitle>
        <CardDescription>
          {hasExistingSettings 
            ? 'Upload your backup file and enter your password to restore your account'
            : 'Set up a password to access your account and log into it securely'
          }
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={hasExistingSettings ? handleRestoreBackup : handleCreateNewKeys}>
          <div className="space-y-4">
            {hasExistingSettings && (
              <div
                className={`border-2 border-dashed rounded-lg p-4 text-center cursor-pointer transition-colors
                  ${isDragging ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400'}
                  ${backupFile ? 'bg-green-50 border-green-500' : ''}`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
              >
                <input
                  type="file"
                  accept=".mpb"
                  onChange={handleFileChange}
                  className="hidden"
                  id="backup-file"
                />
                <label htmlFor="backup-file" className="cursor-pointer">
                  <div className="flex flex-col items-center gap-2">
                    {backupFile ? (
                      <>
                        <FileKey className="w-8 h-8 text-green-500" />
                        <span className="text-sm text-green-600">{backupFile.name}</span>
                      </>
                    ) : (
                      <>
                        <Upload className="w-8 h-8 text-gray-400" />
                        <span className="text-sm text-gray-500">
                          Drop your backup file here or click to browse
                        </span>
                      </>
                    )}
                  </div>
                </label>
              </div>
            )}
            
            <div className="space-y-2">
              <Input
                type="password"
                placeholder={hasExistingSettings ? "Enter your backup password" : "Create a strong password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full"
              />
              {!hasExistingSettings && (
                <p className="text-xs text-gray-500">
                  This password will be used to encrypt your data and restore your account if needed
                </p>
              )}
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <Button
              type="submit"
              className="w-full"
              disabled={loading || (hasExistingSettings && !backupFile) || !password}
            >
              {loading ? (
                <RefreshCw className="w-4 h-4 animate-spin mr-2" />
              ) : hasExistingSettings ? (
                <Lock className="w-4 h-4 mr-2" />
              ) : (
                <Key className="w-4 h-4 mr-2" />
              )}
              {loading
                ? "Processing..."
                : hasExistingSettings
                ? "Restore Account"
                : "Generate Keys"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

export default KeyGeneration;
