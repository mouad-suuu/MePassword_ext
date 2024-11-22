import React, { useEffect, useState } from "react";
import { Eye, EyeOff, Copy } from "lucide-react";
import { Button } from "../ui/button";
import { NewEncryptedPassword } from "../../../services/types";
import EncryptionService from "../../../services/EncryptionService";
import AddKeysDialog from "./AddKeysDialog";

interface KeyData {
  id: string;
  website: string;
  password: string;
  user: string;
}

const Keys: React.FC = () => {
  const [keys, setKeys] = useState<KeyData[]>([]);
  const [settings, setSettings] = useState<any>(null);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchKeys = async () => {
      try {
        // Get settings
        const settingsResponse = await EncryptionService.API.SettingGet();
        if (!settingsResponse.ok) {
          throw new Error(
            `Failed to fetch settings: ${settingsResponse.status}`
          );
        }
        const fetchedSettings = await settingsResponse.json();
        setSettings(fetchedSettings);

        // Get decrypted keys - this now returns the array directly
        const decryptedKeys = await EncryptionService.API.KeysGet();
        setKeys(decryptedKeys);
      } catch (error) {
        console.error("Error fetching data:", error);
        setError(
          error instanceof Error
            ? error.message
            : "An unexpected error occurred"
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
        {keys.length > 0 ? (
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

const KeyItem: React.FC<KeyData> = ({ website, user, password }) => {
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
            variant="ghost"
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
            variant="ghost"
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
