import { Upload, Key, Plus,Lock } from "lucide-react";
import { useState, useCallback } from "react";
import { BackupSecurityService } from "../../../services/auth&security/BackupSecurityService";
import EncryptionService from "../../../services/EncryptionService";
import { SessionManagementService } from "../../../services/sessionManagment/SessionManager";
import { KeyStorage } from "../../../services/storage/KeyStorage";
import { KeySet } from "../../../services/types";
import { Alert, AlertDescription } from "../ui/alert";
import { Button } from "../ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "../ui/card";
import { Input } from "../ui/input";
import StoringService from "../../../services/StorageService";


export default function StartupScreen({
    onKeysLoaded,
    onCreateAccount,
  }: {
    onKeysLoaded: (keys: KeySet) => void;
    onCreateAccount: () => void;
  }) {
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