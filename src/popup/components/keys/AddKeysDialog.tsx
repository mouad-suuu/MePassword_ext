import React, { FormEvent, useState } from "react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import {
  APISettingsPayload,
  KeySet,
  NewEncryptedPassword,
} from "../../../services/types";
import EncryptionService from "../../../services/EncryptionService";
import { v4 as uuidv4 } from "uuid";

interface KeyData {
  id: string;
  website: string;
  password: string;
  user: string;
}

interface AddKeysDialogProps {
  open: boolean;
  onClose: () => void;
  existingKeys?: KeyData[];
}

const AddKeysDialog: React.FC<AddKeysDialogProps> = ({
  open,
  onClose,
  existingKeys,
}) => {
  const [website, setWebsite] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUpdateMode, setIsUpdateMode] = useState(false);
  const [existingKeyId, setExistingKeyId] = useState<string>("");
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [confirmationMessage, setConfirmationMessage] = useState("");

  const handleClose = () => {
    console.log("Closing dialog and resetting state");
    setWebsite("");
    setUsername("");
    setPassword("");
    setError(null);
    onClose();
  };

  const saveKey = async () => {
    setIsSubmitting(true);
    setError(null);

    try {
      const response = await EncryptionService.API.KeysPost({
        website: website.trim(),
        user: username.trim(),
        password,
      });

      const data = await response.json();

      if (response.status === 409) {
        // Conflict - duplicate found
        console.log("Duplicate password found:", data);
        setConfirmationMessage(
          "A password for this website and username already exists. Would you like to update it?"
        );
        setShowConfirmation(true);
        setIsUpdateMode(true);
        setExistingKeyId(data.existingId);
        return;
      }

      if (!response.ok) {
        throw new Error(`Failed to save password: ${response.statusText}`);
      }

      handleClose();
    } catch (error) {
      console.error("Error saving password:", error);
      setError(
        error instanceof Error
          ? error.message
          : "An unexpected error occurred. Please try again."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const existingKey = existingKeys?.find(
        (item) =>
          item.website.toLowerCase().trim() === website.toLowerCase().trim() &&
          item.user.toLowerCase().trim() === username.toLowerCase().trim()
      );

      console.log("Found existing key:", existingKey);

      if (existingKey) {
        setIsSubmitting(false);

        if (existingKey.password === password) {
          setConfirmationMessage(
            "This exact key already exists. No changes needed."
          );
          setShowConfirmation(true);
          return;
        }

        console.log("Setting existing key ID:", existingKey.id);
        setExistingKeyId(existingKey.id);
        setConfirmationMessage(
          "A key for this website and username already exists. Would you like to update it?"
        );
        setShowConfirmation(true);
        setIsUpdateMode(true);
        return;
      }

      await saveKey();
    } catch (error) {
      console.error("Error in handleSubmit:", error);
      setError(
        error instanceof Error
          ? error.message
          : "An unexpected error occurred. Please try again."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  function handleAddPassword(): void {
    console.log("encrypred data:", {
      website,
      username,
      password,
    });
  }

  return (
    <div
      className={`fixed inset-0 backdrop-blur-sm bg-black/30 flex items-center justify-center ${
        open ? "" : "hidden"
      }`}
    >
      <div className="bg-gradient-to-br from-slate-900 to-slate-800 p-8 rounded-2xl shadow-2xl w-96 border border-slate-700/50 backdrop-blur-xl">
        {showConfirmation ? (
          <div className="space-y-4">
            <h2 className="text-2xl font-bold bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
              Confirmation
            </h2>
            <p className="text-slate-300">{confirmationMessage}</p>
            <div className="flex justify-end space-x-3 mt-6">
              <Button
                type="button"
                className="px-4 py-2 bg-slate-800 text-slate-300 hover:bg-slate-700 rounded-lg transition-all duration-200 border border-slate-600"
                onClick={() => {
                  setShowConfirmation(false);
                  setIsUpdateMode(false);
                }}
              >
                Cancel
              </Button>
              {!confirmationMessage.includes("No changes needed") && (
                <Button
                  type="button"
                  className="px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-500 text-white rounded-lg hover:from-cyan-600 hover:to-blue-600 transition-all duration-200"
                  onClick={() => {
                    setShowConfirmation(false);
                    saveKey();
                  }}
                >
                  Update Key
                </Button>
              )}
            </div>
          </div>
        ) : (
          <>
            <h2 className="text-2xl font-bold mb-6 bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
              Add New Key
            </h2>
            <form onSubmit={handleSubmit} className="space-y-8">
              <div className="space-y-6">
                <Input
                  id="website"
                  value={website}
                  onChange={(e) => setWebsite(e.target.value)}
                  label="Website/Where to use"
                  variant="standard"
                  required
                />
                <Input
                  id="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  label="Username/Email"
                  variant="standard"
                  required
                />
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  label="The Key"
                  variant="standard"
                  required
                />
              </div>
              {error && <p className="text-red-400 text-sm">{error}</p>}
              <div className="flex justify-end space-x-3 mt-8">
                <Button
                  type="button"
                  variant="cyber-secondary"
                  onClick={handleClose}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button type="submit" variant="cyber" disabled={isSubmitting}>
                  <span className="relative z-10">
                    {isSubmitting ? "Saving..." : "Save Key"}
                  </span>
                </Button>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  );
};

export default AddKeysDialog;
