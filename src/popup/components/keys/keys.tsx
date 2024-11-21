import React, { useEffect, useState } from "react";
import { Eye, EyeOff, Copy } from "lucide-react";
import { Button } from "../ui/button";
import { NewEncryptedPassword } from "../../../services/types";
import EncryptionService from "../../../services/EncryptionService";
import StoringService from "../../../services/StorageService";
import AddKeysDialog from "./AddKeysDialog";

const Keys: React.FC = () => {
  const [keys, setKeys] = useState<
    { id: string; website: string; password: string; user: string }[]
  >([]);
  const [settings, setSettings] = useState<NewEncryptedPassword[]>([]);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchKeys = async () => {
      try {
        // Get stored keys and credentials
        const response = await EncryptionService.API.SettingGet();
        console.log("Settings Response status:", response.status);

        const responseText = await response.text();
        console.log("Settings received");

        if (!response.ok) {
          throw new Error(
            `Failed to fetch settings: ${response.status} - ${responseText}`
          );
        }

        let fetchedSettings;
        try {
          fetchedSettings = JSON.parse(responseText);
          console.log("Settings parsed successfully");
          setSettings(fetchedSettings);
        } catch (parseError) {
          throw new Error(
            `Invalid JSON response: ${parseError}\nReceived: ${responseText.substring(
              0,
              200
            )}...`
          );
        }
      } catch (error) {
        console.error("Settings fetch error:", error);
        setError(`Settings Error: ${error}`);
        return;
      }

      try {
        const response = await EncryptionService.API.KeysGet();
        console.log("Keys Response status:", response.status);

        const responseText = await response.text();
        console.log("Keys received:", responseText.substring(0, 100));

        if (!response.ok) {
          throw new Error(`Failed to fetch keys: ${response.status}`);
        }

        const data = JSON.parse(responseText);
        const storedKeys = await StoringService.Keys.getKeysFromStorage();

        if (!storedKeys?.privateKey) {
          throw new Error("No private key found in stored credentials");
        }

        const privateKey = await EncryptionService.Utils.importRSAPrivateKey(
          storedKeys.privateKey
        );

        if (!privateKey) {
          throw new Error("Failed to import private key");
        }
        if (!data.keys || data.keys.length === 0) {
          console.log("No keys found in data");
          setKeys([]);
          return;
        }
        try {
          const decryptedData = await EncryptionService.Utils.decryptWithRSA(
            data.keys,
            privateKey
          );
          console.log("Raw keys data:", data.keys);
          console.log("Decrypted Data:", decryptedData);

          if (!decryptedData) {
            throw new Error("Decryption returned null or undefined");
          }

          if (Array.isArray(decryptedData)) {
            const mappedKeys = decryptedData.map((item, index) => {
              console.log("Mapping key:", {
                originalId: data.keys[index].id,
                decryptedItem: item,
              });
              return {
                id: data.keys[index].id,
                website: item.website,
                user: item.user,
                password: item.password,
              };
            });
            console.log("Final mapped keys:", mappedKeys);
            setKeys(mappedKeys);
          } else {
            throw new Error("Decrypted data is not an array");
          }
        } catch (decryptError) {
          console.error("Decryption error:", decryptError);
          setError(`Failed to decrypt keys: ${decryptError}`);
          setKeys([]);
        }
      } catch (error) {
        console.error("Keys fetch error:", error);
        setError(
          error instanceof Error
            ? `Keys Error: ${error.message}`
            : "Failed to fetch keys"
        );
      }
    };
    fetchKeys();
  }, []);

  return (
    <div className="space-y-4">
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold text-gray-800">Keys</h2>
        <Button
          onClick={() => setShowAddDialog(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          Add New
        </Button>
      </div>
      <div className="mt-4">
        {Array.isArray(keys) && keys.length > 0 ? (
          keys.map((item, index) => (
            <KeyItem
              id={item.id}
              key={index}
              website={item.website}
              user={item.user}
              password={item.password}
            />
          ))
        ) : (
          <div className="text-center py-6 text-gray-500">
            No keys saved yet. Click "Add New" to add your first key.
          </div>
        )}
      </div>

      <AddKeysDialog
        open={showAddDialog}
        onClose={() => setShowAddDialog(false)}
        existingKeys={keys}
      />
    </div>
  );
};

const KeyItem: React.FC<NewEncryptedPassword> = ({
  website,
  user,
  password,
}) => {
  const [showPassword, setShowPassword] = useState(false);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  return (
    <div className="bg-white rounded-lg p-4 shadow mb-3 hover:shadow-md transition-shadow">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="font-medium text-gray-800">{website}</h3>
          <p className="text-xs text-gray-500">{user}</p>
        </div>
        <div className="flex space-x-2">
          <Button
            onClick={() => setShowPassword(!showPassword)}
            className="p-2 hover:bg-gray-100 rounded-full"
          >
            {showPassword ? (
              <EyeOff className="w-4 h-4 text-gray-600" />
            ) : (
              <Eye className="w-4 h-4 text-gray-600" />
            )}
          </Button>
          <Button
            onClick={() => copyToClipboard(password)}
            className="p-2 hover:bg-gray-100 rounded-full"
          >
            <Copy className="w-4 h-4 text-gray-600" />
          </Button>
        </div>
      </div>
      {showPassword && (
        <div className="mt-2 text-sm text-gray-800 font-mono bg-gray-50 p-2 rounded">
          {password}
        </div>
      )}
    </div>
  );
};

export default Keys;
