import React, { useState } from "react";
import { Eye, EyeOff, Copy } from "lucide-react";
import { Button } from "./ui/button";

interface PasswordItemProps {
  website: string;
  username: string;
  password: string;
}

const PasswordItem: React.FC<PasswordItemProps> = ({
  website,
  username,
  password,
}) => {
  const [showPassword, setShowPassword] = useState(false);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    // You could add a toast notification here
  };

  return (
    <div className="bg-white rounded-lg p-4 shadow mb-3 hover:shadow-md transition-shadow">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="font-medium text-gray-800">{website}</h3>
          <p className="text-sm text-gray-600">{username}</p>
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
            className="p-2 hover:bg-gray-100 rounded-full"
          >
            <Copy className="w-4 h-4 text-gray-600" />
          </button>
        </div>
      </div>
      {showPassword && (
        <div className="mt-2 text-sm text-gray-800 font-mono">{password}</div>
      )}
    </div>
  );
};

const Passwords = () => {
  // Example data - replace with your actual data source
  const passwords = [
    {
      website: "example.com",
      username: "user@example.com",
      password: "********",
    },
    { website: "test.com", username: "testuser", password: "********" },
  ];

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold text-gray-800">Passwords</h2>
        <Button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
          Add New
        </Button>
      </div>
      <div className="mt-4">
        {passwords.map((item, index) => (
          <PasswordItem key={index} {...item} />
        ))}
      </div>
    </div>
  );
};

export default Passwords;
