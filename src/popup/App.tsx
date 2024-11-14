import React from "react";
import { SessionProvider } from "../context/SessionContext";
import SetupEntry from "./components/setup/SetupEntry";

const App = () => {
  return (
    <div className="min-w-[400px] min-h-96 bg-gray-50">
      <SetupEntry />
    </div>
  );
};

export default App;
