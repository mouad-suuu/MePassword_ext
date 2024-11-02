import React, { useState } from "react";
import Navigation from "./components/Navigation";
import Passwords from "./components/Passwords";
import Keys from "./components/keys";
import Profile from "./components/profile";
import Settings from "./components/Settings";

const App = () => {
  const [activeTab, setActiveTab] = useState("passwords");

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
