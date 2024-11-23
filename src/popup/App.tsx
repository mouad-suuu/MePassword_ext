import React from "react";
import { SessionProvider } from "../context/SessionContext";
import SetupEntry from "./components/setup/SetupEntry";
import { theme } from "./them";

const App = () => {
  return (
    <div className="min-w-[400px] min-h-96 bg-background text-foreground">
      <style>{`
        :root {
          --background: ${theme.colors.bg.primary};
          --foreground: ${theme.colors.text.primary};
          --card: ${theme.colors.bg.secondary};
          --card-foreground: ${theme.colors.text.secondary};
          --popover: ${theme.colors.bg.accent};
          --popover-foreground: ${theme.colors.text.accent};
          --primary: ${theme.colors.accent.primary};
          --primary-foreground: ${theme.colors.text.primary};
          --secondary: ${theme.colors.bg.secondary};
          --secondary-foreground: ${theme.colors.text.secondary};
          --border: ${theme.colors.border.primary};
        }
      `}</style>
      <SetupEntry />
    </div>
  );
};

export default App;
