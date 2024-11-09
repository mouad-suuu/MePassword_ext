import React, { useState, useEffect } from "react";
import StoringService from "./../../services/db";
import EncryptionService from "./../../services/Keys-managment/Encrypt";
import {
  KeySet,
  EncryptedPassword,
  ExtensionSettings,
  UserCredentials,
} from "../../services/types";
import { Button } from "./ui/button";

const StoringServiceTest: React.FC = () => {
  const [keys, setKeys] = useState<KeySet | null>(null);
  const [encryptedPassword, setEncryptedPassword] =
    useState<EncryptedPassword | null>(null);
  const [decryptedPassword, setDecryptedPassword] =
    useState<UserCredentials | null>(null);
  const [settings, setSettings] = useState<ExtensionSettings | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [allPasswords, setAllPasswords] = useState<EncryptedPassword[] | null>(
    null
  );

  useEffect(() => {
    const fetchData = async () => {
      try {
        const keysFromStorage = await StoringService.getKeysFromStorage();
        setKeys(keysFromStorage);

        const passwordFromStorage = await StoringService.getEncryptedPassword(
          "testPassword"
        );
        setEncryptedPassword(passwordFromStorage);

        const settingsFromStorage = await StoringService.getExtensionSettings();
        setSettings(settingsFromStorage);

        const allPasswordsFromStorage =
          await StoringService.getEncryptedPasswords();
        setAllPasswords(allPasswordsFromStorage);
      } catch (err) {
        setError(
          `Failed to fetch data: ${
            err instanceof Error ? err.message : "Unknown error"
          }`
        );
      }
    };
    fetchData();
  }, []);

  const handleStoreKeys = async () => {
    try {
      const newKeys = await EncryptionService.generateKeySet();
      await StoringService.storeKeys(newKeys);
      setKeys(await StoringService.getKeysFromStorage());
      setError(null);
    } catch (err) {
      setError(
        `Failed to store keys: ${
          err instanceof Error ? err.message : "Unknown error"
        }`
      );
    }
  };

  const handleStorePassword = async () => {
    try {
      if (!keys) throw new Error("No keys available for encryption");

      const newPassword: UserCredentials = {
        website: "example.com",
        authToken: "abc123",
        password: "secretPassword",
      };

      const encryptedData = await EncryptionService.encryptPassword(
        newPassword,
        keys
      );
      await StoringService.storeEncryptedPassword(encryptedData);
      setEncryptedPassword(
        await StoringService.getEncryptedPassword("testPassword")
      );
      setError(null);
    } catch (err) {
      setError(
        `Failed to store password: ${
          err instanceof Error ? err.message : "Unknown error"
        }`
      );
    }
  };

  const handleDecryptPassword = async () => {
    try {
      if (!encryptedPassword || !keys)
        throw new Error(
          "No encrypted password or keys available for decryption"
        );

      const decryptedData = await EncryptionService.decryptPassword(
        encryptedPassword,
        keys
      );

      setDecryptedPassword(decryptedData.encryptedData); // Set decrypted data to state
      setError(null);
    } catch (err) {
      setError(
        `Failed to decrypt password: ${
          err instanceof Error ? err.message : "Unknown error"
        }`
      );
    }
  };

  const handleStoreSettings = async () => {
    try {
      const newSettings: ExtensionSettings = {
        serverUrl: "",
        authToken: "",
        dataRetentionTime: 1800000,
        autoLockTime: 1800000,
        biometricEnabled: true,
        theme: "dark",
        autoFill: true,
      };
      await StoringService.storeExtensionSettings(newSettings);
      setSettings(await StoringService.getExtensionSettings());
      setError(null);
    } catch (err) {
      setError(
        `Failed to store settings: ${
          err instanceof Error ? err.message : "Unknown error"
        }`
      );
    }
  };

  const handleGetAllData = async () => {
    try {
      const passwords = await StoringService.getEncryptedPasswords();
      setAllPasswords(passwords);
      setError(null);
    } catch (err) {
      setError(
        `Failed to fetch all passwords: ${
          err instanceof Error ? err.message : "Unknown error"
        }`
      );
    }
  };

  const handleDeletePassword = async () => {
    try {
      if (!encryptedPassword)
        throw new Error("No encrypted password to delete");
      await StoringService.deleteEncryptedPassword(encryptedPassword.id);
      setEncryptedPassword(null);
      setAllPasswords(await StoringService.getEncryptedPasswords());
      setError(null);
    } catch (err) {
      setError(
        `Failed to delete password: ${
          err instanceof Error ? err.message : "Unknown error"
        }`
      );
    }
  };

  const handleClearStorage = async () => {
    try {
      await StoringService.clearStorage();
      setKeys(null);
      setEncryptedPassword(null);
      setDecryptedPassword(null);
      setSettings(null);
      setAllPasswords(null);
      setError(null);
    } catch (err) {
      setError(
        `Failed to clear storage: ${
          err instanceof Error ? err.message : "Unknown error"
        }`
      );
    }
  };

  return (
    <div>
      <h1>Storing Service Test</h1>
      {error && (
        <div style={{ color: "red", marginBottom: "1rem" }}>{error}</div>
      )}
      <Button onClick={handleStoreKeys}>Store Keys</Button>
      <Button onClick={handleStorePassword}>Store Password</Button>
      <Button onClick={handleDecryptPassword} disabled={!allPasswords || !keys}>
        Decrypt Password
      </Button>
      <Button onClick={handleStoreSettings}>Store Settings</Button>
      <Button onClick={handleGetAllData}>Get All Passwords</Button>
      <Button onClick={handleDeletePassword} disabled={!encryptedPassword}>
        Delete Password
      </Button>
      <Button onClick={handleClearStorage}>Clear Storage</Button>
      <h1>=============================Keys=============================</h1>
      <pre>Keys: {JSON.stringify(keys, null, 2)}</pre>
      <h1>
        =============================Encrypted
        Password=============================
      </h1>
      <pre>{JSON.stringify(encryptedPassword, null, 2)}</pre>
      <h1>
        =============================Decrypted
        Password=============================
      </h1>
      <pre>{JSON.stringify(decryptedPassword, null, 2)}</pre>
      <h1>
        =============================Settings=============================
      </h1>
      <pre>{JSON.stringify(settings, null, 2)}</pre>
      <h1>
        ===========================All Passwords===========================
      </h1>
      <pre>{JSON.stringify(allPasswords, null, 2)}</pre>
    </div>
  );
};

export default StoringServiceTest;
