import { Navigation as NavigationIcon, Settings } from "lucide-react";
import React, { useState, useEffect } from "react";
import Keys from "./keys/keys";
import Passwords from "./password/Passwords";
import Profile from "./profile/profile";
import { Alert, AlertDescription, AlertTitle } from "./ui/alert";
import { Navigation } from "./Navigation";
import { SettingsComponent } from "./profile/Settings";
import AddPasswordDialog from "./password/AddPasswordDialog";
import { theme } from "../them";

const Main = () => {
  const [activeTab, setActiveTab] = useState("passwords");
  const [showAddPasswordDialog, setShowAddPasswordDialog] = useState(false);
  const [passwordData, setPasswordData] = useState<
    | {
        website: string;
        username: string;
        password: string;
      }
    | undefined
  >(undefined);

  useEffect(() => {
    const handleMessage = (message: any) => {
      if (message.type === "OPEN_ADD_PASSWORD_DIALOG") {
        console.log(
          "Main received OPEN_ADD_PASSWORD_DIALOG message:",
          message.data
        );
        setPasswordData(message.data);
        setShowAddPasswordDialog(true);
      }
    };

    chrome.runtime.onMessage.addListener(handleMessage);
    return () => chrome.runtime.onMessage.removeListener(handleMessage);
  }, []);

  return (
    <div className="min-w-[400px] min-h-96  bg-background">
      {showAddPasswordDialog && (
        <AddPasswordDialog
          open={showAddPasswordDialog}
          onClose={() => setShowAddPasswordDialog(false)}
          prefilledData={passwordData}
        />
      )}

      <Navigation activeTab={activeTab} setActiveTab={setActiveTab} />
      <main className={`p-4 ${theme.colors.bg.secondary}`}>
        {activeTab === "passwords" && <Passwords />}
        {activeTab === "keys" && <Keys />}
        {activeTab === "profile" && <Profile />}
        {activeTab === "settings" && <SettingsComponent />}
      </main>
    </div>
  );
};

export default Main;
