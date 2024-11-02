import React from "react";
import { Copy, Trash } from "lucide-react";
import { EncryptedPassword } from "../../services/types";
import CryptoManager from "../../services/Keys-managment/CryptoManager";
import APIService from "../../services/db";

interface KeyItemProps {
  name: string;
  value: string;
  created: string;
}

const KeyItem: React.FC<KeyItemProps> = ({ name, value, created }) => {
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    // You could add a toast notification here
  };

  return (
    <div className="bg-white rounded-lg p-4 shadow mb-3 hover:shadow-md transition-shadow">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="font-medium text-gray-800">{name}</h3>
          <p className="text-xs text-gray-500">Created: {created}</p>
        </div>
        <div className="flex space-x-2">
          <button
            onClick={() => copyToClipboard(value)}
            className="p-2 hover:bg-gray-100 rounded-full"
          >
            <Copy className="w-4 h-4 text-gray-600" />
          </button>
          <button className="p-2 hover:bg-gray-100 rounded-full">
            <Trash className="w-4 h-4 text-red-600" />
          </button>
        </div>
      </div>
      <div className="mt-2 text-sm text-gray-800 font-mono bg-gray-50 p-2 rounded">
        {value}
      </div>
    </div>
  );
};

interface PasswordsProps {
  cryptoManager: CryptoManager;
  apiService: APIService;
}
const Keys: React.FC<PasswordsProps> = ({ cryptoManager, apiService }) => {
  const keys = [
    {
      name: "API Key 1",
      value: "sk_test_**********************",
      created: "2024-01-01",
    },
    { name: "SSH Key", value: "ssh-rsa AAAAB3Nz...", created: "2024-01-02" },
  ];

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold text-gray-800">Keys</h2>
        <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
          Add New Key
        </button>
      </div>
      <div className="mt-4">
        {keys.map((key, index) => (
          <KeyItem key={index} {...key} />
        ))}
      </div>
    </div>
  );
};

export default Keys;
