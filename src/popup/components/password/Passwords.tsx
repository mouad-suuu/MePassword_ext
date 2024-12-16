import React, { useEffect, useState } from "react";
import { Eye, EyeOff, Copy, LogIn, Trash2, Share2 } from "lucide-react";
import { Button } from "../ui/button";
import { NewEncryptedPassword } from "../../../services/types";
import EncryptionService from "../../../services/EncryptionService";
import AddPasswordDialog from "./AddPasswordDialog";
import ShareDialog from "../shared/ShareDialog";
import { theme } from "../../them";

const Passwords: React.FC = () => {
  const [passwords, setPasswords] = useState<
    { id: string; website: string; password: string; user: string }[]
  >([]);
  const [settings, setSettings] = useState<NewEncryptedPassword[]>([]);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showShareDialog, setShowShareDialog] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());

  useEffect(() => {
    const fetchPasswords = async () => {
      try {
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

  const handleSelectAll = () => {
    if (selectedItems.size === passwords.length) {
      setSelectedItems(new Set());
    } else {
      setSelectedItems(new Set(passwords.map(p => p.id)));
    }
  };

  const handleDeleteSelected = async () => {
    if (selectedItems.size === 0) return;

    if (window.confirm(`Are you sure you want to delete ${selectedItems.size} passwords?`)) {
      try {
        const deletePromises = Array.from(selectedItems).map(id =>
          EncryptionService.API.PasswordDelete(id)
        );
        await Promise.all(deletePromises);
        setSelectedItems(new Set());
        setRefreshTrigger(prev => prev + 1);
      } catch (error) {
        console.error("Error deleting passwords:", error);
        setError(
          error instanceof Error
            ? error.message
            : "Failed to delete passwords"
        );
      }
    }
  };

  const selectedPasswords = passwords.filter(p => selectedItems.has(p.id));

  return (
    <div className="space-y-4">
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}
      
      <div className="flex justify-between items-center">
        <h2 className={theme.text.heading}>Passwords</h2>
        <div className="flex space-x-2">
          {selectedItems.size > 0 && (
            <>
              <Button
                onClick={() => setShowShareDialog(true)}
                className="bg-blue-600 text-white px-3 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center"
              >
                <Share2 className="w-4 h-4 mr-1" />
                Share ({selectedItems.size})
              </Button>
              <Button
                onClick={handleDeleteSelected}
                className="bg-red-600 text-white px-3 py-2 rounded-lg hover:bg-red-700 transition-colors flex items-center"
              >
                <Trash2 className="w-4 h-4 mr-1" />
                Delete ({selectedItems.size})
              </Button>
            </>
          )}
          <Button
            onClick={() => setShowAddDialog(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Add New
          </Button>
        </div>
      </div>

      <div className="flex items-center mb-2">
        <label className="flex items-center space-x-2">
          <input
            type="checkbox"
            checked={selectedItems.size === passwords.length && passwords.length > 0}
            onChange={handleSelectAll}
            className="form-checkbox h-4 w-4 text-blue-600"
          />
          <span className="text-sm text-gray-600">Select All</span>
        </label>
      </div>

      <div className="mt-4">
        {Array.isArray(passwords) && passwords.length > 0 ? (
          passwords.map((item) => (
            <PasswordItem
              key={item.id}
              {...item}
              isSelected={selectedItems.has(item.id)}
              onSelect={() => {
                const newSelected = new Set(selectedItems);
                if (newSelected.has(item.id)) {
                  newSelected.delete(item.id);
                } else {
                  newSelected.add(item.id);
                }
                setSelectedItems(newSelected);
              }}
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

      <ShareDialog
        open={showShareDialog}
        onClose={() => {
          setShowShareDialog(false);
          setRefreshTrigger((prev) => prev + 1);
        }}
        selectedItems={selectedPasswords}
        type="passwords"
      />
    </div>
  );
};

const PasswordItem: React.FC<
  NewEncryptedPassword & {
    isSelected: boolean;
    onSelect: () => void;
  }
> = ({ id, website, user, password, isSelected, onSelect }) => {
  const [showPassword, setShowPassword] = useState(false);

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
        window.close();
      }
    } catch (error) {
      console.error("Error auto-filling credentials:", error);
    }
  };

  return (
    <div className="bg-cyber-bg rounded-lg p-4 shadow mb-3 hover:shadow-md transition-shadow border border-cyber-border">
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-3">
          <input
            type="checkbox"
            checked={isSelected}
            onChange={onSelect}
            className="form-checkbox h-4 w-4 text-blue-600"
          />
          <div>
            <h3 className="font-medium text-cyber-text-primary">{website}</h3>
            <p className="text-xs text-cyber-text-secondary">{user}</p>
          </div>
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
