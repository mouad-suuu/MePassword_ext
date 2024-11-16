import { Navigation as NavigationIcon, Settings } from "lucide-react";
import React, { useState } from "react";
import Keys from "./keys/keys";
import Passwords from "./password/Passwords";
import Profile from "./profile/profile";
import { Alert, AlertDescription, AlertTitle } from "./ui/alert";
import { Navigation } from "./Navigation";
import { SettingsComponent } from "./profile/Settings";

const Main = () => {
  const [activeTab, setActiveTab] = useState("passwords");
  const [needsKeyRotation, setNeedsKeyRotation] = useState(false);

  const handleLogout = async () => {
    try {
      // TODO: Implement logout functionality
      console.log("Logging out...");
      setActiveTab("passwords");
    } catch (error) {
      console.error("Error logging out:", error);
    }
  };

  return (
    <div className="min-w-[400px] min-h-96 bg-gray-50">
      {needsKeyRotation && (
        <Alert variant="default" className="mb-4">
          <AlertTitle>Security Notice</AlertTitle>
          <AlertDescription>
            Your encryption keys need to be rotated for security.
            <button
              onClick={() => setNeedsKeyRotation(false)}
              className="ml-2 text-sm font-medium underline hover:text-amber-600"
            >
              Rotate Keys Now
            </button>
          </AlertDescription>
        </Alert>
      )}

      <Navigation activeTab={activeTab} setActiveTab={setActiveTab} />
      <main className="p-4">
        {activeTab === "passwords" && <Passwords />}
        {activeTab === "keys" && <Keys />}
        {activeTab === "profile" && <Profile />}
        {activeTab === "settings" && <SettingsComponent />}
      </main>
    </div>
  );
};

export default Main;
