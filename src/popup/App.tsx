import React, { useState, useEffect } from "react";
import Navigation from "./components/Navigation";
import Passwords from "./components/Passwords";
import Keys from "./components/keys";
import Profile from "./components/profile";
import Settings from "./components/Settings";
import SetupEntry from "./components/setup/SetupEntry";
import type { KeySet } from "../services/types";

const App = () => {
  const [activeTab, setActiveTab] = useState("passwords");
  const [isInitialized, setIsInitialized] = useState(false);
  const [needsKeyRotation, setNeedsKeyRotation] = useState(false);

  useEffect(() => {
    // Check if keys exist and if rotation is needed
    const lastRotation = localStorage.getItem("lastKeyRotation");
    if (!lastRotation) {
      setIsInitialized(false);
      return;
    }

    const daysSinceRotation =
      (Date.now() - parseInt(lastRotation)) / (1000 * 60 * 60 * 24);
    setNeedsKeyRotation(daysSinceRotation >= 30);
    setIsInitialized(true);
  }, []);

  const handleSetupComplete = (session: any) => {
    // Store session data and update app state
    setIsInitialized(true);
    // You can now pass the session data to other components
  };

  if (!isInitialized || needsKeyRotation) {
    return <SetupEntry />;
  }

  return (
    <div className="min-w-[400px] min-h-96 bg-gray-50">
      <Navigation activeTab={activeTab} setActiveTab={setActiveTab} />

      <main className="p-4">
        {activeTab === "passwords" && <Passwords />}
        {activeTab === "keys" && <Keys />}
        {activeTab === "profile" && <Profile />}
        {activeTab === "settings" && <Settings />}
      </main>
    </div>
  );
};

export default App;
