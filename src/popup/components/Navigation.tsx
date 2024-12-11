import React from "react";
import {
  Key,
  Lock,
  User,
  Settings as SettingsIcon,
  LockKeyhole,
} from "lucide-react";
import { Button } from "../components/ui/button";
import { Separator } from "../components/ui/separator";
import { SessionManagementService } from "../../services/sessionManagment/SessionManager";
import { theme } from "../them";

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
  onLock?: () => void;
}

export const Navigation: React.FC<NavigationProps> = ({
  activeTab,
  setActiveTab,
  onLock,
}) => {
  const handleLock = async () => {
    const sessionManager = new SessionManagementService();
    await sessionManager.endShortLock();

    window.close();
  };

  return (
    <div className={`bg-${theme.colors.bg.secondary}`}>
      <div className="flex items-center p-2">
        <div className="flex-1 flex justify-around">
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
            label="profile"
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
        <Button
          variant="outline"
          size="icon"
          onClick={handleLock}
          className="ml-2 rounded-full bg-blue-700"
          title="Lock Extension"
        >
          <LockKeyhole className="w-4 h-4" />
        </Button>
      </div>
      <Separator />
    </div>
  );
};
