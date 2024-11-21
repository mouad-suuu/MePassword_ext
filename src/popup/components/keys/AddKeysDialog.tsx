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
interface AddKeysDialogProps {
  open: boolean;
  onClose: () => void;
  existingKeys?: {
    website: string;
    user: string;
    password: string;
    id: string;
  }[];
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
    try {
      console.log("Save key - Update mode:", isUpdateMode);
      console.log("Save key - Existing key ID:", existingKeyId);

      const settingsResponse = await EncryptionService.API.SettingGet();
      if (!settingsResponse.ok) {
        throw new Error("Failed to fetch encryption settings");
      }

      const Settings = await settingsResponse.json();
      if (!Settings?.settings?.publicKey) {
        throw new Error("No public key found in settings");
      }

      const publicKey = await EncryptionService.Utils.importRSAPublicKey(
        Settings.settings.publicKey
      );

      const encryptedData = await EncryptionService.Utils.encryptWithRSA(
        {
          website: website.trim(),
          user: username,
          password,
        },
        publicKey
      );

      const response = isUpdateMode
        ? await EncryptionService.API.KeysPut(existingKeyId, {
            password: encryptedData.password,
          })
        : await EncryptionService.API.KeysPost({
            id: uuidv4(),
            website: encryptedData.website,
            user: encryptedData.user,
            password: encryptedData.password,
          });

      if (!response.ok) {
        throw new Error(
          `Failed to ${isUpdateMode ? "update" : "save"} key: ${
            response.statusText
          }`
        );
      }

      handleClose();
    } catch (error) {
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
      className={`fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center ${
        open ? "" : "hidden"
      }`}
    >
      <div className="bg-white p-6 rounded-lg shadow-xl w-96">
        {showConfirmation ? (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold mb-4">Confirmation</h2>
            <p className="text-gray-700">{confirmationMessage}</p>
            <div className="flex justify-end space-x-2 mt-4">
              <Button
                type="button"
                variant="outline"
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
                  onClick={() => {
                    console.log("Update button clicked - ID:", existingKeyId);
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
            <h2 className="text-xl font-semibold mb-4">Add New Key</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="website">Website</Label>
                <Input
                  id="Where to use"
                  value={website}
                  onChange={(e) => setWebsite(e.target.value)}
                  placeholder="( a website like https://example.com )"
                  required
                />
              </div>
              <div>
                <Label htmlFor="username">Username/Email</Label>
                <Input
                  id="Key name"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Token, API key, etc..."
                  required
                />
              </div>
              <div>
                <Label htmlFor="password">The Key</Label>
                <Input
                  id="Key"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
              {error && <p className="text-red-500 text-sm">{error}</p>}
              <div className="flex justify-end space-x-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleClose}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? "Saving..." : "Save Password"}
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
