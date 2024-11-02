import React from "react";
import { Bell, Lock, Shield, Moon } from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { Switch } from "../components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";

interface SettingItemProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  children: React.ReactNode;
}

const SettingItem: React.FC<SettingItemProps> = ({
  icon,
  title,
  description,
  children,
}) => (
  <Card>
    <CardContent className="flex items-center justify-between p-6">
      <div className="flex items-start space-x-4">
        <div className="p-2 bg-secondary rounded-full">{icon}</div>
        <div>
          <h3 className="font-medium">{title}</h3>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>
      </div>
      {children}
    </CardContent>
  </Card>
);

const Settings: React.FC = () => {
  return (
    <div className="space-y-4 p-4">
      <CardHeader className="px-0">
        <CardTitle>Settings</CardTitle>
      </CardHeader>

      <div className="space-y-4">
        <SettingItem
          icon={<Bell className="w-4 h-4" />}
          title="Notifications"
          description="Control your notification preferences"
        >
          <Switch />
        </SettingItem>

        <SettingItem
          icon={<Lock className="w-4 h-4" />}
          title="Auto-Lock"
          description="Automatically lock after inactivity"
        >
          <Select defaultValue="10">
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Select time" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="5">5 minutes</SelectItem>
              <SelectItem value="10">10 minutes</SelectItem>
              <SelectItem value="30">30 minutes</SelectItem>
            </SelectContent>
          </Select>
        </SettingItem>

        <SettingItem
          icon={<Shield className="w-4 h-4" />}
          title="Security Level"
          description="Set your preferred security level"
        >
          <Select defaultValue="high">
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Select level" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="high">High</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="low">Low</SelectItem>
            </SelectContent>
          </Select>
        </SettingItem>

        <SettingItem
          icon={<Moon className="w-4 h-4" />}
          title="Dark Mode"
          description="Toggle dark mode theme"
        >
          <Switch />
        </SettingItem>
      </div>
    </div>
  );
};

export default Settings;
