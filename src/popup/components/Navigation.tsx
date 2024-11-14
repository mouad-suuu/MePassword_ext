import React from "react";
import { Key, Lock, User, Settings as SettingsIcon } from "lucide-react";
import { Button } from "../components/ui/button";
import { Separator } from "../components/ui/separator";

interface NavButtonProps {
  icon: React.ReactNode;
  label: string;
  isActive: boolean;
  onClick: () => void;
}

const NavButton: React.FC<NavButtonProps> = ({
  icon,
  label,
  isActive,
  onClick,
}) => {
  return (
    <Button
      variant={isActive ? "secondary" : "ghost"}
      size="sm"
      onClick={onClick}
      className="flex flex-col items-center gap-1 h-16 w-16"
    >
      {icon}
      <span className="text-xs">{label}</span>
    </Button>
  );
};

interface NavigationProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export const Navigation: React.FC<NavigationProps> = ({
  activeTab,
  setActiveTab,
}) => {
  return (
    <div className="bg-background">
      <div className="flex justify-around items-center p-2">
        <NavButton
          icon={<Lock className="w-4 h-4" />}
          label="Passwords"
          isActive={activeTab === "passwords"}
          onClick={() => setActiveTab("passwords")}
        />
        <NavButton
          icon={<Key className="w-4 h-4" />}
          label="Keys"
          isActive={activeTab === "keys"}
          onClick={() => setActiveTab("keys")}
        />
        <NavButton
          icon={<User className="w-4 h-4" />}
          label="Profile"
          isActive={activeTab === "profile"}
          onClick={() => setActiveTab("profile")}
        />
        <NavButton
          icon={<SettingsIcon className="w-4 h-4" />}
          label="Settings"
          isActive={activeTab === "settings"}
          onClick={() => setActiveTab("settings")}
        />
      </div>
      <Separator />
    </div>
  );
};
