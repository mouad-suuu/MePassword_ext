import React, { useEffect, useState } from "react";
import { Eye, EyeOff, Copy, LogIn, Trash2 } from "lucide-react";
import { Button } from "../ui/button";
import { NewEncryptedPassword } from "../../../services/types";
import EncryptionService from "../../../services/EncryptionService";
import StoringService from "../../../services/StorageService";
import AddPasswordDialog from "./AddPasswordDialog";
import { theme } from "../../them";
const Passwords: React.FC = () => {
  const [passwords, setPasswords] = useState<
    { id: string; website: string; password: string; user: string }[]
  >([]);
  const [settings, setSettings] = useState<NewEncryptedPassword[]>([]);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  useEffect(() => {
    const fetchPasswords = async () => {
      try {
        // Fetch and decrypt passwords
        const passwords = await EncryptionService.API.PasswordsGet();
        console.log("the passwords component: fetched passwords:", passwords);
        setPasswords(passwords);
      } catch (error) {
        console.error("Error fetching data:", error);
        setError(
          error instanceof Error
            ? error.message
            : "An unexpected error occurred"
        );
      }
    };

    fetchPasswords();
  }, [refreshTrigger]);

  return (
    <div className="space-y-4">
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}
      <div className="flex justify-between items-center">
        <h2 className={theme.text.heading}>Passwords</h2>
        <Button
          onClick={() => setShowAddDialog(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          Add New
        </Button>
      </div>
      <div className="mt-4">
        {Array.isArray(passwords) && passwords.length > 0 ? (
          passwords.map((item, index) => (
            <PasswordItem
              key={item.id}
              {...item}
              onDelete={() => setRefreshTrigger((prev) => prev + 1)}
            />
          ))
        ) : (
          <div className="text-center py-6 text-gray-500">
            No passwords saved yet. Click "Add New" to get started.
          </div>
        )}
      </div>

      <AddPasswordDialog
        open={showAddDialog}
        onClose={() => {
          setShowAddDialog(false);
          setRefreshTrigger((prev) => prev + 1);
        }}
      />
    </div>
  );
};

const PasswordItem: React.FC<
  NewEncryptedPassword & {
    onDelete: () => void;
  }
> = ({ id, website, user, password, onDelete }) => {
  const [showPassword, setShowPassword] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const handleAutoFill = async () => {
    try {
      const [tab] = await chrome.tabs.query({
        active: true,
        currentWindow: true,
      });
      if (tab.id) {
        await chrome.tabs.sendMessage(tab.id, {
          type: "AUTO_FILL_CREDENTIALS",
          data: { user, password },
        });
        // Close the popup after sending the auto-fill message
        window.close();
      }
    } catch (error) {
      console.error("Error auto-filling credentials:", error);
    }
  };

  const handleDelete = async () => {
    if (!id || isDeleting) return;

    if (
      window.confirm(
        `Are you sure you want to delete the password for ${website}?`
      )
    ) {
      setIsDeleting(true);
      try {
        // Log the ID to verify it's being sent
        console.log("Deleting password with ID:", id);
        const response = await EncryptionService.API.PasswordDelete(id);

        // Add response logging
        console.log("Delete response status:", response.status);
        if (!response.ok) {
          const errorData = await response.json();
          console.log("Delete error response:", errorData);
          throw new Error(errorData.error || "Failed to delete password");
        }
        onDelete();
      } catch (error) {
        console.error("Error deleting password:", error);
        alert(
          error instanceof Error ? error.message : "Failed to delete password"
        );
      } finally {
        setIsDeleting(false);
      }
    }
  };

  return (
    <div className="bg-cyber-bg rounded-lg p-4 shadow mb-3 hover:shadow-md transition-shadow border border-cyber-border">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="font-medium text-cyber-text-primary">{website}</h3>
          <p className="text-xs text-cyber-text-secondary">{user}</p>
        </div>
        <div className="flex space-x-2">
          <Button
            onClick={handleAutoFill}
            variant="ghost"
            className="p-2 hover:bg-gray-100 rounded-full transform rotate-90"
            title="Auto-fill credentials"
          >
            <LogIn className="w-4 h-4" />
          </Button>
          <Button
            onClick={() => setShowPassword(!showPassword)}
            variant="ghost"
            className="p-2 hover:bg-gray-100 rounded-full"
          >
            {showPassword ? (
              <EyeOff className="w-4 h-4" />
            ) : (
              <Eye className="w-4 h-4" />
            )}
          </Button>
          <Button
            onClick={() => copyToClipboard(password)}
            variant="ghost"
            className="p-2 hover:bg-gray-100 rounded-full"
          >
            <Copy className="w-4 h-4" />
          </Button>
          <Button
            onClick={handleDelete}
            variant="ghost"
            className="p-2 hover:bg-gray-100 rounded-full text-red-600"
            disabled={isDeleting}
            title="Delete password"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </div>
      {showPassword && (
        <div className="mt-2 text-sm text-cyber-text-primary font-mono bg-gray-50 p-2 rounded">
          {password}
        </div>
      )}
    </div>
  );
};

export default Passwords;
