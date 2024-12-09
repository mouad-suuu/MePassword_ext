import React, { useState } from 'react';
import { Button } from "../../components/ui/button"
import { Input } from "../../components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../components/ui/card"
import { useAuth, UserButton, useUser } from "@clerk/chrome-extension";
import { Alert, AlertDescription } from "../../components/ui/alert";
import EncryptionService from "../../../services/EncryptionService";
import StoringService from "../../../services/StorageService";
import { KeySet, UserCredentials } from "../../../services/types";
import { SessionManagementService } from "../../../services/sessionManagment/SessionManager";
import { BackupSecurityService } from "../../../services/auth&security/BackupSecurityService";
import { FileKey } from "lucide-react";
import { SecureStorageService } from '../../../services/storage/WindowsHelloStorage';
import { useNavigate } from 'react-router-dom';

const KeyGeneration: React.FC = () => {
  const { user } = useUser();
  const { getToken } = useAuth();
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    console.log("KeyGeneration: Starting key generation process");

    if (!user) {
      console.error("KeyGeneration: User not found");
      setError('User not found. Please sign in again.');
      setLoading(false);
      return;
    }
   
    try {
      console.log("KeyGeneration: Getting auth key from windows storage");
      const result = await SecureStorageService.getKeysFromStorage();
      console.log("KeyGeneration: Windows storage result:", result ? "Keys found" : "No keys found");

      console.log("KeyGeneration: Getting auth token");
      const authKey = await getToken(); 
      
      if (!authKey) {
        console.error("KeyGeneration: Auth key not found");
        throw new Error('Auth key not found. Please sign in again.');
      }
      console.log("KeyGeneration: Auth token retrieved successfully");

      // Create user credentials with Clerk data
      const userCredentials: UserCredentials = {
        username: user.username || user.firstName || '',
        email: user.emailAddresses[0].emailAddress,
        password: password,
        userId: user.id,
        authToken: authKey,
      };
      console.log("KeyGeneration: User credentials created");

      // Generate key components
      const keys: KeySet = {
        privateKey: "",
        AESKey: "",
        IV: "",
        Credentials: { ...userCredentials },

      };

      console.log("KeyGeneration: Starting key component generation");
      const { rsaKeyPair, aesKey } = await EncryptionService.KeyGeneration.generateKeyComponents();
      console.log("KeyGeneration: Key components generated successfully");

      // Update keys with generated values
      keys.privateKey = rsaKeyPair.privateKey.key;
      keys.AESKey = aesKey.key;
      keys.IV = aesKey.iv;
      
      console.log("KeyGeneration: Starting credential encryption");
      const encryptedCredentials = await EncryptionService.CredentialCrypto.encryptCredentials(
        userCredentials,
        aesKey
      );
      keys.Credentials = encryptedCredentials.encryptedData;
      console.log("KeyGeneration: Credentials encrypted successfully");

      console.log("KeyGeneration: Storing keys");
      await StoringService.Keys.storeKeys(keys);
      console.log("KeyGeneration: Keys stored successfully");

      // Create backup
      const backupService = BackupSecurityService.getInstance();
      console.log("KeyGeneration: Creating secure backup");
      const backupBlob = await backupService.createSecureBackup(password);
      console.log("KeyGeneration: Backup created successfully");

      // Download backup file
      console.log("KeyGeneration: Downloading backup file");
      const url = URL.createObjectURL(backupBlob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "mepassword-backup.mpb";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      console.log("KeyGeneration: Backup file downloaded successfully");

      // Send public key to server and initialize session
      try {
        console.log("KeyGeneration: Sending public key to server");
        await EncryptionService.API.SettingsPost(rsaKeyPair.publicKey.key);
        console.log("KeyGeneration: Public key sent to server successfully");
        console.log("KeyGeneration: Initializing session");
        await SessionManagementService.initialize();
        console.log("KeyGeneration: Session initialized successfully");
        
        // Navigate to vault after successful setup
        navigate('/vault');
      } catch (error) {
        console.error("KeyGeneration: Error sending public key to server:", error);
        throw new Error("Failed to send public key to server");
      }

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate keys. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative flex min-w-[350px] h-[450px] items-center justify-center bg-background p-4">
      <div className="absolute top-4 right-4">
        <UserButton afterSignOutUrl="/" />
      </div>
      <Card className="w-[350px]">
        <CardHeader className="pb-2 pt-4">
          <CardTitle>Generate Your Keys</CardTitle>
          <CardDescription>Create a master password to secure your vault</CardDescription>
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
                className="w-full"
                disabled={loading}
              />
            </div>
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            <Button type="submit" className="w-full" disabled={loading}>
              <FileKey className="mr-2 h-4 w-4" />
              {loading ? "Generating Keys..." : "Generate Keys"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default KeyGeneration;
