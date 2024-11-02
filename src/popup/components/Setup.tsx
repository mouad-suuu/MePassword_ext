import React, { useState } from "react";
import {
  SetupStage,
  InitialSetupData,
  ExtensionSettings,
} from "../../services/types";
import SetupService from "../../services/SetupService";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Card } from "./ui/card";
import { Separator } from "./ui/separator";

interface SetupProps {
  onSetupComplete: (settings: ExtensionSettings) => Promise<void>;
}

const Setup: React.FC<SetupProps> = ({ onSetupComplete }) => {
  const [stage, setStage] = useState<SetupStage>("initial");
  const [setupData, setSetupData] = useState<InitialSetupData>({
    githubUsername: "",
    deployedAppUrl: "",
    authKey: "",
  });
  const [keyFile, setKeyFile] = useState<File | null>(null);
  const setupService = new SetupService();

  const handleFileUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (file) {
      setKeyFile(file);
      const success = await setupService.importKeys(file);
      if (success) {
        // Navigate to main password view
        // You'll need to implement this navigation
      }
    }
  };

  const handleNewSetup = async () => {
    setStage("github-setup");
  };

  const handleGithubSetup = () => {
    // This should probably be dynamic based on setupData.githubUsername
    window.open("https://github.com/" + setupData.githubUsername, "_blank");
    setStage("app-setup");
  };

  const handleAppSetup = async () => {
    try {
      const { downloadUrl } = await setupService.initiateNewSetup(setupData);

      // Trigger key file download
      const link = document.createElement("a");
      link.href = downloadUrl;
      link.download = "mepassword-keys.json";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      setStage("complete");
      await onSetupComplete(setupData as any);
    } catch (error) {
      console.error("Setup failed:", error);
      // Handle error (show error message to user)
    }
  };

  const renderStage = () => {
    switch (stage) {
      case "initial":
        return (
          <div className="space-y-4">
            <h2 className="text-xl font-bold">Welcome to MePassword</h2>
            <div className="space-y-4">
              <Button onClick={() => handleNewSetup()} className="w-full">
                Create New Password Box
              </Button>
              <Separator />
              <div>
                <label className="block text-sm mb-2">
                  Import Existing Keys
                </label>
                <Input
                  type="file"
                  accept=".json"
                  onChange={handleFileUpload}
                  className="w-full"
                />
              </div>
            </div>
          </div>
        );

      case "github-setup":
        return (
          <div className="space-y-4">
            <h2 className="text-xl font-bold">GitHub Setup</h2>
            <p className="text-sm">
              To create your password box, you'll need a GitHub account to
              deploy the web application.
            </p>
            <Input
              placeholder="GitHub Username"
              value={setupData.githubUsername}
              onChange={(e) =>
                setSetupData({ ...setupData, githubUsername: e.target.value })
              }
            />
            <Button onClick={handleGithubSetup} className="w-full">
              Continue to GitHub Setup
            </Button>
          </div>
        );

      case "app-setup":
        return (
          <div className="space-y-4">
            <h2 className="text-xl font-bold">Application Setup</h2>
            <Input
              placeholder="Deployed App URL"
              value={setupData.deployedAppUrl}
              onChange={(e) =>
                setSetupData({ ...setupData, deployedAppUrl: e.target.value })
              }
            />
            <Input
              placeholder="Auth Key"
              value={setupData.authKey}
              onChange={(e) =>
                setSetupData({ ...setupData, authKey: e.target.value })
              }
            />
            <Button onClick={handleAppSetup} className="w-full">
              Complete Setup
            </Button>
          </div>
        );

      case "complete":
        return (
          <div className="space-y-4">
            <h2 className="text-xl font-bold">Setup Complete!</h2>
            <p className="text-sm">
              Your key file has been downloaded. Please keep it safe and secure
              - it's required to access your passwords.
            </p>
            <Button onClick={() => window.close()} className="w-full">
              Get Started
            </Button>
          </div>
        );
    }
  };

  return <Card className="p-6">{renderStage()}</Card>;
};

export default Setup;
