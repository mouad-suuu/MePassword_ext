import React, { useState, useEffect } from "react";
import StoringService from "./../../services/StorageService";
import EncryptionService from "../../services/EncryptionService";
import { KeySet, UserCredentials, SymmetricKeys } from "../../services/types";
import { Button } from "./ui/button";

const StoringServiceTest: React.FC = () => {
  const [keys, setKeys] = useState<KeySet | null>(null);

  const [encryptedPassword, setEncryptedPassword] = useState<KeySet | null>(
    null
  );
  const [decryptedPassword, setDecryptedPassword] =
    useState<UserCredentials | null>(null);

  const [error, setError] = useState<string | null>(null);
  const [allPasswords, setAllPasswords] = useState<KeySet | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const keysFromStorage = await StoringService.Keys.getKeysFromStorage();
        setKeys(keysFromStorage as any);

        const passwordFromStorage =
          await StoringService.Credentials.getEncryptedCridentials_Keys();
        setEncryptedPassword(passwordFromStorage);

        const allPasswordsFromStorage =
          await StoringService.Credentials.getEncryptedCridentials_Keys();
        setAllPasswords(allPasswordsFromStorage as any);
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
      const passwordFromStorage =
        await StoringService.Credentials.getEncryptedCridentials_Keys();
      setEncryptedPassword(passwordFromStorage);
      const newKeys = await EncryptionService.KeyGeneration.generateKeySet();
      const formattedKeys = {
        privateKey: newKeys.RSAkeys.privateKey.key,
        AESKey: newKeys.AESKey.key,
        IV: newKeys.AESKey.iv,
        Credentials: passwordFromStorage?.Credentials,
      };
      await StoringService.Keys.storeKeys(formattedKeys as any);
      setKeys(await StoringService.Keys.getKeysFromStorage());
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
      const keysFromStorage = await StoringService.Keys.getKeysFromStorage();
      if (!keys || !keysFromStorage)
        throw new Error("No keys available for encryption");
      const newPassword: UserCredentials = {
        server: "example.com",
        authToken: "abc123",
        password: "secretPassword",
      };

      const encryptedData =
        await EncryptionService.CredentialCrypto.encryptCredentials(
          newPassword,
          {
            key: keys.AESKey,
            algorithm: "AES-GCM",
            length: 256,
            iv: keys.IV,
          }
        );
      const data: KeySet = {
        privateKey: keys.privateKey,
        AESKey: keys.AESKey,
        IV: keys.IV,
        Credentials: encryptedData.encryptedData,
      };
      await StoringService.Credentials.storeEncryptedCredentials(data);
      setEncryptedPassword(
        (await StoringService.Credentials.getEncryptedCridentials_Keys()) ||
          null
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

      const decryptedData =
        await EncryptionService.CredentialCrypto.decryptCredentials(
          encryptedPassword.Credentials,
          {
            key: encryptedPassword.AESKey,
            algorithm: "AES-GCM",
            length: 256,
            iv: encryptedPassword.IV,
          }
        );

      setDecryptedPassword(decryptedData as UserCredentials);
      setError(null);
    } catch (err) {
      setError(
        `Failed to decrypt password: ${
          err instanceof Error ? err.message : "Unknown error"
        }`
      );
    }
  };

  const handleGetAllData = async () => {
    try {
      const passwords =
        await StoringService.Credentials.getEncryptedCridentials_Keys();
      setAllPasswords(passwords as any);
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
      await StoringService.SecureStorage.clearAllData();
      setEncryptedPassword(null);
      setAllPasswords(
        await StoringService.Credentials.getEncryptedCridentials_Keys()
      );
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
      await StoringService.SecureStorage.clearAllData();
      setKeys(null);
      setEncryptedPassword(null);
      setDecryptedPassword(null);

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
        ===========================All Passwords===========================
      </h1>
      <pre>{JSON.stringify(allPasswords, null, 2)}</pre>
    </div>
  );
};

export default StoringServiceTest;
