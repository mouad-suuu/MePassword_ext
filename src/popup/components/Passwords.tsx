import React, { useEffect, useState } from "react";
import { Eye, EyeOff, Copy } from "lucide-react";
import { Button } from "./ui/button";
import CryptoManager from "../../services/Keys-managment/CryptoManager";
import APIService from "../../services/db";
import { EncryptedPassword } from "../../services/types";

const PasswordItem: React.FC<
  EncryptedPassword & { cryptoManager: CryptoManager }
> = ({
  encryptedWebsite,
  encryptedUsername,
  encryptedPassword,
  cryptoManager,
}) => {
  const [showPassword, setShowPassword] = useState(false);
  const [website, setWebsite] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  useEffect(() => {
    const decryptData = async () => {
      setWebsite(await cryptoManager.decryptPassword(encryptedWebsite as any));
      setUsername(
        await cryptoManager.decryptPassword(encryptedUsername as any)
      );
      setPassword(
        await cryptoManager.decryptPassword(encryptedPassword as any)
      );
    };
    decryptData();
  }, [cryptoManager, encryptedWebsite, encryptedUsername, encryptedPassword]);

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
interface PasswordsProps {
  cryptoManager: CryptoManager;
  apiService: APIService;
}
const Passwords: React.FC<PasswordsProps> = ({ cryptoManager, apiService }) => {
  const [passwords, setPasswords] = useState<EncryptedPassword[]>([]);

  // Add useEffect to fetch passwords when component mounts
  useEffect(() => {
    const fetchPasswords = async () => {
      const encryptedPasswords = await apiService.getPasswords();
      const decryptedPasswords = (encryptedPasswords?.data || []).map(
        (encPass: EncryptedPassword) => ({
          website: cryptoManager.decrypt(encPass.encryptedWebsite),
          username: cryptoManager.decrypt(encPass.encryptedUsername),
          password: cryptoManager.decrypt(encPass.encryptedPassword),
        })
      );
      setPasswords(decryptedPasswords as any);
    };

    fetchPasswords().catch(console.error);
  }, [cryptoManager, apiService]);

  return (
    <div className="space-y-4">
      {/* ... existing JSX ... */}
      <div className="mt-4">
        {passwords.map((item, index) => (
          <PasswordItem key={index} {...item} cryptoManager={cryptoManager} />
        ))}
      </div>
    </div>
  );
};
export default Passwords;
