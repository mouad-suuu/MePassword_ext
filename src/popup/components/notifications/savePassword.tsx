import React from "react";
import { useEffect, useState } from "react";
import AddPasswordDialog from "../password/AddPasswordDialog";
import EncryptionService from "../../../services/EncryptionService";
import { NewEncryptedPassword } from "../../../services/types";

interface SavePasswordProps {
  prefilledData?: {
    website: string;
    username: string;
    password: string;
  };
}

export const SavePasswordNotification: React.FC<SavePasswordProps> = ({
  prefilledData,
}) => {
  const [showDialog, setShowDialog] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Handle message
  useEffect(() => {
    const handleMessage = async (message: any) => {
      console.log("SavePassword received message:", message);
      if (message.type === "OPEN_ADD_PASSWORD_DIALOG") {
        setShowDialog(true);
      }
    };

    chrome.runtime.onMessage.addListener(handleMessage);
    return () => chrome.runtime.onMessage.removeListener(handleMessage);
  }, []);

  if (!showDialog) return null;

  return (
    <AddPasswordDialog
      open={showDialog}
      onClose={() => {
        console.log("Closing dialog");
        setShowDialog(false);
      }}
      prefilledData={prefilledData}
    />
  );
};
