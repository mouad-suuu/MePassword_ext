import React, { useState, useEffect } from "react";
import AuthEntry from "./AuthEntry";
import CreateAccount from "./CreateAccount";
import EnterKeys from "./EnterKeys";
import DatabaseService from "../../../services/db";
import SessionManager from "../../../services/Keys-managment/SessionManager";
import EncryptionService from "../../../services/Keys-managment/Encrypt";
import {
  EncryptedPassword,
  KeySet,
  UserCredentials,
} from "../../../services/types";

const SetupEntry: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isNewUser, setIsNewUser] = useState(false);
  const [hasKeys, setHasKeys] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkUserStatus();
  }, []);

  const checkUserStatus = async () => {
    try {
      setIsLoading(true);
      const keys = await DatabaseService.getKeysFromStorage();
      const hasStoredKeys = !!keys;
      setHasKeys(hasStoredKeys);

      if (!hasStoredKeys) {
        setIsNewUser(true);
      } else {
        // Check if there's an active session
        const session = await SessionManager.instance.validateSession();
        if (session) {
          setIsAuthenticated(true);
        }
      }
    } catch (error) {
      console.error("Error checking user status:", error);
      setIsNewUser(true);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAuthenticate = async (credentials: UserCredentials) => {
    try {
      setIsLoading(true);
      const encryptedData = await DatabaseService.getAllEncryptedPasswords();
      const keySet = SessionManager.instance.getKeySet();

      if (!encryptedData?.length || !keySet) {
        throw new Error("No stored credentials found");
      }

      // Decrypt and verify stored credentials
      const decryptedData = await EncryptionService.decryptPassword(
        encryptedData[0],
        keySet
      );

      if (
        decryptedData.encryptedData.website === credentials.website &&
        decryptedData.encryptedData.password === credentials.password
      ) {
        await SessionManager.instance.initSession("user-id");
        setIsAuthenticated(true);
      } else {
        throw new Error("Invalid credentials");
      }
    } catch (error) {
      console.error("Authentication failed:", error);
      alert("Authentication failed: " + (error as Error).message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateAccount = async (credentials: UserCredentials) => {
    try {
      setIsLoading(true);
      // Generate new encryption keys
      const keySet = EncryptionService.generateKeySet();
      await DatabaseService.storeKeys(keySet);

      // Encrypt and store user credentials
      const encryptedData = await encryptUserData(credentials, keySet);
      await DatabaseService.storeEncryptedPassword(encryptedData);

      // Initialize session
      await SessionManager.instance.initSession("user-id");
      setIsAuthenticated(true);
    } catch (error) {
      console.error("Account creation failed:", error);
      alert("Account creation failed: " + (error as Error).message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEnterKeys = async (keys: string) => {
    try {
      setIsLoading(true);
      const parsedKeys = JSON.parse(keys) as KeySet;
      await DatabaseService.storeKeys(parsedKeys);
      await SessionManager.instance.initSession("user-id");
      setIsAuthenticated(true);
    } catch (error) {
      console.error("Invalid keys format:", error);
      alert("Invalid keys format: " + (error as Error).message);
    } finally {
      setIsLoading(false);
    }
  };

  const encryptUserData = async (
    userData: UserCredentials,
    keySet: KeySet
  ): Promise<EncryptedPassword> => {
    const id = crypto.randomUUID();
    const ivArray = new Uint8Array(12);
    crypto.getRandomValues(ivArray);
    const iv = Array.from(ivArray)
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
    const timestamp = Date.now();

    const encryptedData = {
      website: await EncryptionService.encryptWithConstantTime(
        userData.website,
        keySet.dataKey.key,
        iv
      ),
      authToken: await EncryptionService.encryptWithConstantTime(
        userData.authToken,
        keySet.dataKey.key,
        iv
      ),
      password: await EncryptionService.encryptWithConstantTime(
        userData.password,
        keySet.dataKey.key,
        iv
      ),
    };

    return {
      id,
      encryptedData,
      iv,
      algorithm: keySet.dataKey.algorithm,
      keyId: keySet.id,
      createdAt: timestamp,
      modifiedAt: timestamp,
      lastAccessed: timestamp,
      version: 1,
      strength: "strong",
    };
  };

  if (isLoading) {
    return (
      <div className="min-h-[400px] flex items-center justify-center">
        <div className="text-gray-600">Loading...</div>
      </div>
    );
  }

  if (isAuthenticated) {
    return (
      <div className="min-h-[400px] p-4">
        <h1 className="text-2xl font-bold mb-4">
          Welcome to Your Secure Vault!
        </h1>
        {/* Add your authenticated content here */}
      </div>
    );
  }

  return (
    <div className="min-h-[400px] p-4">
      {isNewUser ? (
        <div className="space-y-4">
          <h1 className="text-2xl font-bold mb-4">Create New Account</h1>
          <CreateAccount onCreateAccount={handleCreateAccount} />
        </div>
      ) : hasKeys ? (
        <div className="space-y-4">
          <h1 className="text-2xl font-bold mb-4">Enter Keys</h1>
          <EnterKeys onEnterKeys={handleEnterKeys} />
        </div>
      ) : (
        <div className="space-y-4">
          <h1 className="text-2xl font-bold mb-4">Authentication</h1>
          <AuthEntry
            onAuthenticate={handleAuthenticate}
            onBiometricAuth={() => {}} // Implement if needed
          />
        </div>
      )}
    </div>
  );
};

export default SetupEntry;
