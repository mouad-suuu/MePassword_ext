import React, { FormEvent, useState } from "react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import EncryptionService from "../../../services/EncryptionService";
interface AddPasswordDialogProps {
  open: boolean;
  onClose: () => void;
  prefilledData?: {
    website: string;
    username: string;
    password: string;
  };
}

const AddPasswordDialog: React.FC<AddPasswordDialogProps> = ({
  open,
  onClose,
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
      if (isUpdateMode && existingPasswordId) {
        // Update existing password
        const response = await EncryptionService.API.PasswordsPut(
          existingPasswordId,
          {
            website: website.trim(),
            user: username.trim(),
            password,
          }
        );
        if (!response.ok) {
          throw new Error(`Failed to update password: ${response.statusText}`);
        }
      } else {
        // Add new password
        const response = await EncryptionService.API.PasswordPost({
          website: website.trim(),
          user: username.trim(),
          password,
        });
        if (!response.ok) {
          throw new Error(`Failed to save password: ${response.statusText}`);
        }
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

  const checkForDuplicates = async () => {
    try {
      const existingPasswords = await EncryptionService.API.PasswordsGet();

      const existingPassword = existingPasswords?.find((item) => {
        const websiteMatch =
          item.website.toLowerCase().trim() === website.toLowerCase().trim();
        const userMatch =
          item.user.toLowerCase().trim() === username.toLowerCase().trim();
        return websiteMatch && userMatch;
      });

      if (existingPassword) {
        if (existingPassword.password === password) {
          setConfirmationMessage(
            "This exact password already exists. No changes needed."
          );
          setShowConfirmation(true);
          return true;
        }

        // Set update mode if the password is different
        setConfirmationMessage(
          "A password for this website and username already exists. Would you like to update it?"
        );
        setShowConfirmation(true);
        setIsUpdateMode(true);
        setExistingPasswordId(existingPassword.id);
        return true;
      }

      return false;
    } catch (error) {
      console.error("Error checking for duplicates:", error);
      throw error;
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const hasDuplicate = await checkForDuplicates();
      if (!hasDuplicate) {
        await savePassword();
      }
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
      className={`fixed inset-0 backdrop-blur-sm bg-black/30 flex items-center justify-center ${
        open ? "" : "hidden"
      }`}
    >
      <div className="bg-white p-8 rounded-2xl shadow-2xl w-96 border border-purple-400 backdrop-blur-xl">
        {showConfirmation ? (
          <div className="space-y-4">
            <h2 className="text-2xl font-bold text-purple-600">Confirmation</h2>
            <p className="text-gray-700">{confirmationMessage}</p>
            <div className="flex justify-end space-x-3 mt-6">
              <Button
                type="button"
                className="px-4 py-2 bg-gray-200 text-gray-700 hover:bg-gray-200 rounded-lg transition-all duration-200 border border-gray-300"
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
                  className="px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-lg transition-all duration-200"
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
            <h2 className="text-2xl font-bold mb-6 text-purple-600">
              {isUpdateMode ? "Update Password" : "Add New Password"}
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
                  disabled={isUpdateMode}
                />

                <Input
                  id="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  label="Username/Email"
                  variant="standard"
                  required
                  disabled={isUpdateMode}
                />

                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  label="Password"
                  variant="standard"
                  required
                />
              </div>

              {error && <p className="text-red-500 text-sm">{error}</p>}

              <div className="flex justify-end space-x-3 mt-8">
                <Button
                  type="button"
                  variant="cyber-secondary"
                  onClick={handleClose}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="cyber-secondary"
                  disabled={isSubmitting}
                >
                  <span className="relative z-10">
                    {isSubmitting
                      ? isUpdateMode
                        ? "Updating..."
                        : "Saving..."
                      : isUpdateMode
                      ? "Update Password"
                      : "Save Password"}
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

export default AddPasswordDialog;
