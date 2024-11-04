import React, { useState, useEffect } from "react";
import { LockKeyhole, Key, Shield, AlertTriangle } from "lucide-react";
import { Alert, AlertDescription } from "./ui/alert";
import Encrypt from "../../services/Keys-managment/Encrypt";
import { KeySet } from "../../services/types";
import { SessionManager } from "../../services/Keys-managment/SessionManager";

interface SetupProps {
  onComplete: (keys: KeySet) => void;
}

interface StoredCredentials {
  encryptedUrl: string;
  encryptedAuthKey: string;
}

interface SessionData {
  masterKey: CryptoKey;
  encryptionKeys: any;
}

/**
 * SecureSetup Component
 * Handles the initial setup and configuration of the password manager
 * @component
 * @param {SetupProps} props - Component properties
 * @returns {JSX.Element} Rendered setup wizard
 */
const SecureSetup: React.FC<SetupProps> = ({ onComplete }) => {
  const [isNewUser, setIsNewUser] = useState(true);
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [masterPassword, setMasterPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [website, setWebsite] = useState("");
  const [authKey, setAuthKey] = useState("");
  const [encryptionKeys, setEncryptionKeys] = useState(null);
  const sessionManager = new SessionManager<SessionData>();

  /**
   * Checks for existing encryption keys on component mount
   * Updates isNewUser state based on localStorage data
   */
  useEffect(() => {
    const hasExistingKeys = localStorage.getItem("hasEncryptionKeys");
    if (hasExistingKeys) {
      setIsNewUser(false);
    }
  }, []);

  /**
   * Validates the master password against security requirements
   * @param {string} password - The password to validate
   * @returns {string|null} Error message if validation fails, null if password is valid
   */
  const validateMasterPassword = (password: string) => {
    if (password.length < 2) return "Password must be at least 12 characters";
    return null;
  };

  /**
   * Initializes encryption for a new account
   * Generates master key and encryption keys, stores them securely
   * @async
   * @throws {Error} If encryption initialization fails
   */
  const initializeNewAccount = async () => {
    setLoading(true);
    setError("");

    try {
      const passwordError = validateMasterPassword(masterPassword);
      if (passwordError) {
        setError(passwordError);
        return;
      }

      if (masterPassword !== confirmPassword) {
        setError("Passwords do not match");
        return;
      }

      const encrypt = new Encrypt();

      // Generate master key from password using PBKDF2
      const salt = crypto.getRandomValues(new Uint8Array(16));
      const masterKey = await encrypt.deriveKey(masterPassword, {
        salt,
        iterations: 600000,
        keyLength: 256,
      });

      // Initialize encryption keys and protect private key

      const keys = await encrypt.InitializeKeys();
      const protectedPrivateKey = await encrypt.protectPrivateKey(
        keys.encryption.privateKey.key,
        masterKey
      );

      // Update keys with protected private key
      const secureKeys = {
        ...keys,
        encryption: {
          ...keys.encryption,
          privateKey: {
            ...keys.encryption.privateKey,
            key: protectedPrivateKey,
            protected: true,
          },
        },
        salt: Buffer.from(salt).toString("base64"),
      };

      // Store session data
      await sessionManager.startSession(
        {
          masterKey,
          encryptionKeys: secureKeys,
        },
        3
      ); // 3 days session

      setEncryptionKeys(secureKeys as any);
      localStorage.setItem("hasEncryptionKeys", "true");
      localStorage.setItem("keySalt", Buffer.from(salt).toString("base64"));

      setStep(2);
    } catch (error: any) {
      setError("Failed to initialize encryption: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Handles website and authentication key setup
   * Encrypts and stores website credentials
   * @async
   * @throws {Error} If website setup fails
   */
  const handleWebsiteSetup = async () => {
    setLoading(true);
    setError("");

    try {
      if (!website || !authKey) {
        setError("Website and authentication key are required");
        return;
      }

      const sessionData = await sessionManager.getSessionData();
      if (!sessionData) {
        throw new Error("Session expired");
      }

      const encrypt = new Encrypt();
      const result = await encrypt.InitAccount(website, authKey);

      // Format keys for secure display
      const displayKeys = {
        websiteKey: result.keySet.websiteKey,
        authKey: result.keySet.authKey,
        dataKey: result.keySet.dataKey,
        encryptedData: {
          website: result.encryptedWebsite,
          authKey: result.encryptedAuthKey,
        },
      };

      setEncryptionKeys(displayKeys as any);
      onComplete(displayKeys as any);
      setStep(3);
    } catch (error: any) {
      setError("Failed to encrypt website data: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Handles returning user authentication
   * Verifies master password and restores session
   * @async
   * @throws {Error} If authentication fails
   */
  const returnToExistingSetup = async () => {
    setLoading(true);
    setError("");

    try {
      const encrypt = new Encrypt();
      const salt = Buffer.from(localStorage.getItem("keySalt") || "", "base64");

      const masterKey = await encrypt.deriveKey(masterPassword, {
        salt,
        iterations: 600000,
        keyLength: 256,
      });

      // Start new session with existing master key
      await sessionManager.startSession(
        {
          masterKey,
          encryptionKeys: null, // You might want to load existing keys here
        },
        3
      );

      setStep(4);
    } catch (error) {
      setError("Invalid master password");
    } finally {
      setLoading(false);
    }
  };

  /**
   * Validates and sanitizes user input
   * @param {string} input - User input to validate
   * @returns {string} Sanitized input
   * @throws {Error} If input is invalid
   */
  const validateInput = (input: string): string => {
    if (!input?.trim()) {
      throw new Error("Input cannot be empty");
    }
    // Remove any potentially dangerous characters
    return input.trim().replace(/[<>]/g, "");
  };

  /**
   * Validates website URL format
   * @param {string} url - Website URL to validate
   * @returns {boolean} True if URL is valid
   */
  const isValidWebsiteUrl = (url: string): boolean => {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  };

  /**
   * Error boundary for setup component
   * @param {Error} error - Error that occurred
   * @returns {JSX.Element} Error display component
   */
  const ErrorFallback = ({ error }: { error: Error }) => (
    <div className="error-container">
      <h2>Something went wrong</h2>
      <pre>{error.message}</pre>
      <button onClick={() => window.location.reload()}>Try again</button>
    </div>
  );

  /**
   * Verifies session persistence capability
   * @returns {Promise<boolean>} True if storage is available
   */
  const checkStorageAvailability = async (): Promise<boolean> => {
    try {
      const testKey = "test_storage_" + Date.now();
      await chrome.storage.local.set({ [testKey]: true });
      await chrome.storage.local.remove(testKey);
      return true;
    } catch {
      return false;
    }
  };

  useEffect(() => {
    return () => {
      // Cleanup sensitive data from memory
      setMasterPassword("");
      setConfirmPassword("");
      setAuthKey("");
    };
  }, []);

  return (
    <div className=" mx-auto p-6 space-y-8 min-w-[400px] min-h-96 bg-gray-50">
      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {step === 1 && (
        <div className="space-y-6">
          <div className="text-center">
            <Shield className="mx-auto h-12 w-12 text-blue-600" />
            <h2 className="mt-4 text-2xl font-bold">Secure Password Manager</h2>
          </div>

          {isNewUser ? (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Master Password
                </label>
                <input
                  type="password"
                  value={masterPassword}
                  onChange={(e) => setMasterPassword(e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm h-8"
                  placeholder="Enter master password"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Confirm Password
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm h-8"
                  placeholder="Confirm master password"
                />
              </div>

              <button
                onClick={initializeNewAccount}
                disabled={loading}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                {loading ? "Initializing..." : "Create New Account"}
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Master Password
                </label>
                <input
                  type="password"
                  value={masterPassword}
                  onChange={(e) => setMasterPassword(e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                  placeholder="Enter your master password"
                />
              </div>

              <button
                onClick={returnToExistingSetup}
                disabled={loading}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
              >
                {loading ? "Verifying..." : "Continue Setup"}
              </button>
            </div>
          )}
        </div>
      )}

      {step === 2 && (
        <div className="space-y-6">
          <div className="bg-yellow-50 p-4 rounded-md">
            <div className="flex">
              <div className="flex-shrink-0">
                <AlertTriangle className="h-5 w-5 text-yellow-400" />
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-yellow-800">
                  Backup Your Keys
                </h3>
                <div className="mt-2 text-sm text-yellow-700">
                  <p>
                    Store these keys securely. They cannot be recovered if lost!
                  </p>
                </div>
              </div>
            </div>
          </div>

          <pre className="bg-gray-100 p-4 rounded-md text-xs overflow-x-auto">
            {JSON.stringify(encryptionKeys, null, 2)}
          </pre>

          <button
            onClick={() => setStep(4)}
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Continue to Website Setup
          </button>
        </div>
      )}

      {step === 4 && (
        <div className="space-y-6">
          <h3 className="text-lg font-medium">Website Configuration</h3>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Website URL
              </label>
              <input
                type="text"
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                placeholder="https://example.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Authentication Key
              </label>
              <input
                type="password"
                value={authKey}
                onChange={(e) => setAuthKey(e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                placeholder="Enter authentication key"
              />
            </div>

            <button
              onClick={handleWebsiteSetup}
              disabled={loading}
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              {loading ? "Processing..." : "Encrypt and Store"}
            </button>
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="space-y-6">
          <h3 className="text-lg font-medium">Setup Complete</h3>

          <div className="bg-green-50 p-4 rounded-md">
            <div className="flex">
              <div className="flex-shrink-0">
                <Key className="h-5 w-5 text-green-400" />
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-green-800">
                  Keys Generated Successfully
                </h3>
                <div className="mt-2 text-sm text-green-700">
                  <p>Store these keys securely for future access:</p>
                </div>
              </div>
            </div>
          </div>

          <pre className="bg-gray-100 p-4 rounded-md text-xs overflow-x-auto">
            {JSON.stringify(encryptionKeys, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
};

export default SecureSetup;
