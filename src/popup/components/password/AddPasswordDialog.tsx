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
interface AddPasswordDialogProps {
  open: boolean;
  onClose: () => void;
  existingPasswords?: {
    website: string;
    user: string;
    password: string;
    id: string;
  }[];
  prefilledData?: {
    website: string;
    username: string;
    password: string;
  };
}

const AddPasswordDialog: React.FC<AddPasswordDialogProps> = ({
  open,
  onClose,
  existingPasswords,
  prefilledData = {
    website: "",
    username: "",
    password: "",
  },
}) => {
  const [website, setWebsite] = useState(prefilledData.website);
  const [username, setUsername] = useState(prefilledData.username);
  const [password, setPassword] = useState(prefilledData.password);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUpdateMode, setIsUpdateMode] = useState(false);
  const [existingPasswordId, setExistingPasswordId] = useState<string | null>(
    null
  );
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

  const savePassword = async () => {
    setIsSubmitting(true);
    setError(null);

    try {
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
          user: username.trim(),
          password,
        },
        publicKey
      );

      const response = await EncryptionService.API.PasswordPost({
        id: uuidv4(),
        website: encryptedData.website,
        user: encryptedData.user,
        password: encryptedData.password,
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
        setExistingPasswordId(data.existingId);
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
      const existingPassword = existingPasswords?.find(
        (item) =>
          item.website.toLowerCase().trim() === website.toLowerCase().trim() &&
          item.user.toLowerCase().trim() === username.toLowerCase().trim()
      );

      console.log("Found existing password:", existingPassword);

      if (existingPassword) {
        setIsSubmitting(false);

        if (existingPassword.password === password) {
          setConfirmationMessage(
            "This exact password already exists. No changes needed."
          );
          setShowConfirmation(true);
          return;
        }

        console.log("Existing password ID:", existingPassword.id);
        setConfirmationMessage(
          "A password for this website and username already exists. Would you like to update it?"
        );
        setShowConfirmation(true);
        setIsUpdateMode(true);
        setExistingPasswordId(existingPassword.id);
        return;
      }

      await savePassword();
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
                    setShowConfirmation(false);
                    savePassword();
                  }}
                >
                  Update Password
                </Button>
              )}
            </div>
          </div>
        ) : (
          <>
            <h2 className="text-xl font-semibold mb-4">
              {isUpdateMode ? "Update Password" : "Add New Password"}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="website">Website/Where to use</Label>
                <Input
                  id="website"
                  value={website}
                  onChange={(e) => setWebsite(e.target.value)}
                  placeholder="https://example.com"
                  required
                  disabled={isUpdateMode}
                />
              </div>
              <div>
                <Label htmlFor="username">Username/Email</Label>
                <Input
                  id="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="user@example.com"
                  required
                  disabled={isUpdateMode}
                />
              </div>
              <div>
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
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
                  {isSubmitting
                    ? isUpdateMode
                      ? "Updating..."
                      : "Saving..."
                    : isUpdateMode
                    ? "Update Password"
                    : "Save Password"}
                </Button>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  );
};

export default AddPasswordDialog;
