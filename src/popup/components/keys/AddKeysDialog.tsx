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
}

const AddKeysDialog: React.FC<AddPasswordDialogProps> = ({ open, onClose }) => {
  const [website, setWebsite] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  const handleClose = () => {
    console.log("Closing dialog and resetting state");
    setWebsite("");
    setUsername("");
    setPassword("");
    setError(null);
    onClose();
  };

  // const validateInputs = (): string | null => {
  //   if (!website.trim()) {
  //     return "Website is required";
  //   }

  //   // try {
  //   //   new URL(website); // Validate URL format
  //   // } catch {
  //   //   return "Please enter a valid URL (e.g., https://example.com)";
  //   // }

  //   // if (!username.trim()) {
  //   //   return "Username/Email is required";
  //   // }

  //   // if (!password) {
  //   //   return "Password is required";
  //   // }

  //   // if (password.length < 8) {
  //   //   return "Password must be at least 8 characters long";
  //   // }

  //   return null;
  // };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      // Get settings
      const settingsResponse = await EncryptionService.API.SettingGet();
      console.log("Settings Response to add password:", settingsResponse);
      if (!settingsResponse.ok) {
        throw new Error("Failed to fetch encryption settings");
      }

      const Settings = await settingsResponse.json();
      console.log("Parsed settings:", Settings);

      // Check if Settings has the required data
      if (!Settings?.settings?.publicKey) {
        throw new Error("No public key found in settings");
      }

      // Import public key
      let publicKey;
      try {
        publicKey = await EncryptionService.Utils.importRSAPublicKey(
          Settings.settings.publicKey
        );
      } catch (error) {
        throw new Error("Invalid public key format");
      }

      // Encrypt data
      let encryptedData;
      try {
        encryptedData = await EncryptionService.Utils.encryptWithRSA(
          {
            website: website.trim(),
            user: username.trim(),
            password,
          },
          publicKey
        );
      } catch (error) {
        throw new Error("Failed to encrypt password data");
      }

      // Post encrypted data
      const response = await EncryptionService.API.KeysPost({
        id: uuidv4(),
        website: encryptedData.website,
        user: encryptedData.user,
        password: encryptedData.password,
      });

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

  function handleAddPassword(): void {
    console.log("encrypred data:", {
      website,
      username,
      password,
    });
  }

  // Add loading state for better UX
  const [isSubmitting, setIsSubmitting] = useState(false);

  return (
    <div
      className={`fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center ${
        open ? "" : "hidden"
      }`}
    >
      <div className="bg-white p-6 rounded-lg shadow-xl w-96">
        <h2 className="text-xl font-semibold mb-4">Add New Password</h2>
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
      </div>
    </div>
  );
};

export default AddKeysDialog;
