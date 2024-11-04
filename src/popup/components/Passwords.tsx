import React, { useState, useEffect } from "react";
import { Eye, EyeOff, Copy } from "lucide-react";
import { Button } from "./ui/button";
import { Alert, AlertDescription } from "./ui/alert";
import Encrypt from "../../services/Keys-managment/Encrypt";

/**
 * Storage adapter interface for handling different storage environments
 * @interface
 */
interface StorageAdapter {
  get: (keys: string[]) => Promise<Record<string, any>>;
  set: (items: Record<string, any>) => Promise<void>;
}

/**
 * Chrome extension storage implementation
 * Handles data persistence in Chrome extension environment
 * @implements {StorageAdapter}
 */
class ChromeStorageAdapter implements StorageAdapter {
  /**
   * Retrieves data from Chrome local storage
   * @param {string[]} keys - Array of keys to retrieve
   * @returns {Promise<Record<string, any>>} Object containing retrieved key-value pairs
   * @throws {Error} If Chrome storage is not available
   */
  async get(keys: string[]) {
    console.log("ChromeStorageAdapter: Attempting to get keys:", keys);
    if (typeof chrome !== "undefined" && chrome.storage) {
      const result = await chrome.storage.local.get(keys);
      console.log("ChromeStorageAdapter: Retrieved data:", {
        keysRequested: keys,
        keysFound: Object.keys(result),
      });
      return result;
    }
    console.error("ChromeStorageAdapter: Chrome storage not available");
    throw new Error("Chrome storage not available");
  }

  /**
   * Stores data in Chrome local storage
   * @param {Record<string, any>} items - Key-value pairs to store
   * @returns {Promise<void>}
   * @throws {Error} If Chrome storage is not available
   */
  async set(items: Record<string, any>) {
    console.log(
      "ChromeStorageAdapter: Attempting to set items:",
      Object.keys(items)
    );
    if (typeof chrome !== "undefined" && chrome.storage) {
      await chrome.storage.local.set(items);
      console.log("ChromeStorageAdapter: Items set successfully");
      return;
    }
    console.error("ChromeStorageAdapter: Chrome storage not available");
    throw new Error("Chrome storage not available");
  }
}

/**
 * Local storage adapter for web environment
 * @implements {StorageAdapter}
 */
class LocalStorageAdapter implements StorageAdapter {
  /**
   * Retrieves data from local storage
   * @param {string[]} keys - Array of keys to retrieve
   * @returns {Promise<Record<string, any>>} Object containing retrieved key-value pairs
   */
  async get(keys: string[]) {
    console.log("LocalStorageAdapter: Attempting to get keys:", keys);
    const result: Record<string, any> = {};
    keys.forEach((key) => {
      const value = localStorage.getItem(key);
      if (value) {
        result[key] = JSON.parse(value);
      }
    });
    console.log("LocalStorageAdapter: Retrieved data:", {
      keysRequested: keys,
      keysFound: Object.keys(result),
    });
    return result;
  }

  /**
   * Stores data in local storage
   * @param {Record<string, any>} items - Key-value pairs to store
   * @returns {Promise<void>}
   */
  async set(items: Record<string, any>) {
    console.log(
      "LocalStorageAdapter: Attempting to set items:",
      Object.keys(items)
    );
    Object.entries(items).forEach(([key, value]) => {
      localStorage.setItem(key, JSON.stringify(value));
    });
    console.log("LocalStorageAdapter: Items set successfully");
  }
}

/**
 * Create storage instance based on environment
 * @returns {StorageAdapter} Storage instance based on environment
 */
const storage: StorageAdapter =
  typeof chrome !== "undefined" && chrome.storage
    ? new ChromeStorageAdapter()
    : new LocalStorageAdapter();

interface EncryptedPassword {
  id: string;
  encryptedData: {
    website: string;
    username: string;
    password: string;
    notes?: string;
  };
  iv: string;
  algorithm: string;
  keyId: string;
  strength: string;
}

interface PasswordItemProps {
  website: string;
  username: string;
  password: string;
  notes?: string;
}

interface ApiResponse {
  success: boolean;
  data?: EncryptedPassword[];
  error?: string;
}

interface PasswordsProps {
  onPasswordAdded: () => void;
}

const encryptService = new Encrypt();

/**
 * Password item component that displays individual password entries
 * @component
 * @param {PasswordItemProps} props - Password item properties
 * @returns {JSX.Element} Rendered password item
 */
const PasswordItem: React.FC<PasswordItemProps> = ({
  website,
  username,
  password,
  notes,
}) => {
  const [showPassword, setShowPassword] = useState(false);
  const [copied, setCopied] = useState(false);

  /**
   * Copies text to clipboard
   * @param {string} text - Text to copy
   * @returns {Promise<void>}
   */
  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  return (
    <div className="bg-white rounded-lg p-4 shadow mb-3 hover:shadow-md transition-shadow">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="font-medium text-gray-800">{website}</h3>
          <p className="text-sm text-gray-600">{username}</p>
          {notes && <p className="text-xs text-gray-500 mt-1">{notes}</p>}
        </div>
        <div className="flex space-x-2">
          <button
            onClick={() => setShowPassword(!showPassword)}
            className="p-2 hover:bg-gray-100 rounded-full"
          >
            {showPassword ? (
              <EyeOff className="w-4 h-4 text-gray-600" />
            ) : (
              <Eye className="w-4 h-4 text-gray-600" />
            )}
          </button>
          <button
            onClick={() => copyToClipboard(password)}
            className="p-2 hover:bg-gray-100 rounded-full relative"
          >
            <Copy className="w-4 h-4 text-gray-600" />
            {copied && (
              <span className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs py-1 px-2 rounded">
                Copied!
              </span>
            )}
          </button>
        </div>
      </div>
      {showPassword && (
        <div className="mt-2 text-sm text-gray-800 font-mono">{password}</div>
      )}
    </div>
  );
};

/**
 * Form component for adding new passwords
 * @component
 * @param {Object} props - Component properties
 * @param {() => void} props.onPasswordAdded - Callback when password is added
 */
const AddPasswords = ({ onPasswordAdded }: { onPasswordAdded: () => void }) => {
  const [formData, setFormData] = useState({
    website: "",
    username: "",
    password: "",
    notes: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  /**
   * Handles form submission and password encryption
   * @param {React.FormEvent} e - Form event
   * @returns {Promise<void>}
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      console.log("Starting password addition process...");

      // Get credentials from storage
      const credentials = await storage.get([
        "encryptedWebsite",
        "encryptedAuthKey",
        "keySet",
      ]);

      console.log("Retrieved credentials:", {
        hasEncryptedWebsite: !!credentials.encryptedWebsite,
        hasEncryptedAuthKey: !!credentials.encryptedAuthKey,
        hasKeySet: !!credentials.keySet,
      });

      if (
        !credentials.encryptedWebsite ||
        !credentials.encryptedAuthKey ||
        !credentials.keySet
      ) {
        console.error("Missing credentials:", {
          encryptedWebsite: !credentials.encryptedWebsite,
          encryptedAuthKey: !credentials.encryptedAuthKey,
          keySet: !credentials.keySet,
        });
        throw new Error("Missing required credentials");
      }

      // Decrypt credentials
      console.log("Attempting to decrypt credentials...");
      const decrypted = await encryptService.startExtensio(
        credentials.encryptedWebsite,
        credentials.encryptedAuthKey,
        credentials.keySet
      );
      console.log("Successfully decrypted credentials", {
        hasWebsite: !!decrypted.website,
        hasAuthKey: !!decrypted.authKey,
      });

      // Make API request
      const response = await fetch(`${decrypted.website}/api/passwords`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${decrypted.authKey}`,
        },
        body: JSON.stringify({
          encryptedData: {
            website: formData.website,
            username: formData.username,
            password: formData.password,
            notes: formData.notes,
          },
          algorithm: "AES-GCM",
          iv: crypto.getRandomValues(new Uint8Array(12)).toString(),
          keyId: `key_${Date.now()}`,
          strength: "strong",
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to add password");
      }

      setFormData({ website: "", username: "", password: "", notes: "" });
      onPasswordAdded();
    } catch (err) {
      console.error("Error in handleSubmit:", err);
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-4 p-4 bg-white rounded-lg shadow"
    >
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      <div className="space-y-2">
        <input
          type="text"
          placeholder="Website"
          className="w-full p-2 border rounded"
          value={formData.website}
          onChange={(e) =>
            setFormData({ ...formData, website: e.target.value })
          }
          required
        />
        <input
          type="text"
          placeholder="Username"
          className="w-full p-2 border rounded"
          value={formData.username}
          onChange={(e) =>
            setFormData({ ...formData, username: e.target.value })
          }
          required
        />
        <input
          type="password"
          placeholder="Password"
          className="w-full p-2 border rounded"
          value={formData.password}
          onChange={(e) =>
            setFormData({ ...formData, password: e.target.value })
          }
          required
        />
        <textarea
          placeholder="Notes (optional)"
          className="w-full p-2 border rounded"
          value={formData.notes}
          onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
        />
      </div>
      <Button
        type="submit"
        className="w-full bg-blue-600 text-white hover:bg-blue-700"
        disabled={loading}
      >
        {loading ? "Adding..." : "Add Password"}
      </Button>
    </form>
  );
};

/**
 * Main passwords management component
 * @component
 * @param {PasswordsProps} props - Component properties
 */
const Passwords: React.FC<PasswordsProps> = ({ onPasswordAdded }) => {
  const [showAddForm, setShowAddForm] = useState(false);
  const [passwords, setPasswords] = useState<PasswordItemProps[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchPasswords();
  }, []);

  /**
   * Fetches and decrypts stored passwords
   * @returns {Promise<void>}
   */
  const fetchPasswords = async () => {
    try {
      console.log("Starting fetchPasswords...");

      // Get credentials from storage
      const credentials = await storage.get([
        "encryptedWebsite",
        "encryptedAuthKey",
        "keySet",
      ]);

      console.log("Storage retrieval result:", {
        hasEncryptedWebsite: !!credentials.encryptedWebsite,
        hasEncryptedAuthKey: !!credentials.encryptedAuthKey,
        hasKeySet: !!credentials.keySet,
        storageType:
          typeof chrome !== "undefined" && chrome.storage ? "Chrome" : "Local",
      });

      if (
        !credentials.encryptedWebsite ||
        !credentials.encryptedAuthKey ||
        !credentials.keySet
      ) {
        console.error("Missing credentials in fetchPasswords:", {
          encryptedWebsite: !credentials.encryptedWebsite,
          encryptedAuthKey: !credentials.encryptedAuthKey,
          keySet: !credentials.keySet,
        });
        throw new Error("Missing required credentials");
      }

      // Decrypt credentials
      console.log("Attempting to decrypt credentials...");
      const decrypted = await encryptService.startExtensio(
        credentials.encryptedWebsite,
        credentials.encryptedAuthKey,
        credentials.keySet
      );
      console.log("Credentials decrypted successfully", {
        hasWebsite: !!decrypted.website,
        hasAuthKey: !!decrypted.authKey,
      });

      // Fetch passwords
      console.log("Fetching passwords from API...");
      const response = await fetch(`${decrypted.website}/api/passwords`, {
        headers: {
          Authorization: `Bearer ${decrypted.authKey}`,
        },
      });

      console.log("API Response status:", response.status);

      if (!response.ok) {
        throw new Error(`Failed to fetch passwords: ${response.status}`);
      }

      const data: ApiResponse = await response.json();
      console.log("API Response data:", {
        success: data.success,
        hasData: !!data.data,
        passwordCount: data.data?.length,
      });

      // Decrypt passwords
      const decryptedPasswords = await Promise.all(
        data.data!.map(async (item: EncryptedPassword) => {
          const decryptedData = await encryptService.decryptSymmetric(
            item.encryptedData.website,
            credentials.keySet.websiteKey
          );

          return {
            website: decryptedData,
            username: item.encryptedData.username,
            password: await encryptService.decryptSymmetric(
              item.encryptedData.password,
              credentials.keySet.authKey
            ),
            notes: item.encryptedData.notes,
          };
        })
      );

      setPasswords(decryptedPasswords);
    } catch (err) {
      console.error("Error in fetchPasswords:", err);
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  /**
   * Handles successful password addition
   * Updates UI and refreshes password list
   */
  const handlePasswordAdded = () => {
    setShowAddForm(false);
    fetchPasswords();
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold text-gray-800">Passwords</h2>
        <Button
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          onClick={() => setShowAddForm(!showAddForm)}
        >
          {showAddForm ? "Cancel" : "Add New"}
        </Button>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {showAddForm && <AddPasswords onPasswordAdded={handlePasswordAdded} />}

      {loading ? (
        <div className="text-center py-4 text-gray-600">
          Loading passwords...
        </div>
      ) : (
        <div className="mt-4">
          {passwords.length === 0 ? (
            <div className="text-center py-4 text-gray-600">
              No passwords saved yet
            </div>
          ) : (
            passwords.map((item, index) => (
              <PasswordItem key={index} {...item} />
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default Passwords;
