import React from "react";
import { useEffect, useState } from "react";
import AddPasswordDialog from "../password/AddPasswordDialog";

interface SavePasswordProps {
  prefilledData?: {
    website: string;
    username: string;
    password: string;
  };
}

export const SavePasswordNotification: React.FC<SavePasswordProps> = () => {
  const [showDialog, setShowDialog] = useState(false);
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    const handleMessage = (message: any) => {
      console.log("SavePassword received message:", message);

      if (message.type === "OPEN_ADD_PASSWORD_DIALOG") {
        console.log("Opening add password dialog with data:", message.data);
        setData(message.data);
        setShowDialog(true);
      }
    };

    // Add message listener
    chrome.runtime.onMessage.addListener(handleMessage);

    // Cleanup
    return () => {
      chrome.runtime.onMessage.removeListener(handleMessage);
    };
  }, []);

  if (!showDialog) return null;

  return (
    <>
      <AddPasswordDialog
        open={showDialog}
        onClose={() => setShowDialog(false)}
        prefilledData={data}
      />
    </>
  );
};
