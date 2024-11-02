import React, { ReactNode } from "react";
import { Bell, Lock, Shield, Moon } from "lucide-react";
import { ExtensionSettings } from "../../services/types";

interface SettingItemProps {
  icon: ReactNode;
  title: string;
  description: string;
  children: ReactNode;
}

const SettingItem: React.FC<SettingItemProps> = ({
  icon,
  title,
  description,
  children,
}) => (
  <div className="flex items-start justify-between p-4 bg-white rounded-lg shadow">
    <div className="flex items-start space-x-3">
      <div className="p-2 bg-gray-50 rounded-full">{icon}</div>
      <div>
        <h3 className="font-medium text-gray-800">{title}</h3>
        <p className="text-sm text-gray-600">{description}</p>
      </div>
    </div>
    {children}
  </div>
);

interface SettingsProps {
  settings: ExtensionSettings;
  onUpdateSettings: (newSettings: ExtensionSettings) => Promise<void>;
  onReset: () => Promise<void>;
}

const Settings: React.FC<SettingsProps> = ({
  settings,
  onUpdateSettings,
  onReset,
}) => {
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold text-gray-800 mb-4">Settings</h2>

      <div className="space-y-3">
        <SettingItem
          icon={<Bell className="w-5 h-5 text-gray-600" />}
          title="Notifications"
          description="Control your notification preferences"
        >
          <div className="flex items-center">
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" className="sr-only peer" />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>
        </SettingItem>

        <SettingItem
          icon={<Lock className="w-5 h-5 text-gray-600" />}
          title="Auto-Lock"
          description="Automatically lock after inactivity"
        >
          <select className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 p-2.5">
            <option value="5">5 minutes</option>
            <option value="10">10 minutes</option>
            <option value="30">30 minutes</option>
          </select>
        </SettingItem>

        <SettingItem
          icon={<Shield className="w-5 h-5 text-gray-600" />}
          title="Security Level"
          description="Set your preferred security level"
        >
          <select className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 p-2.5">
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
        </SettingItem>

        <SettingItem
          icon={<Moon className="w-5 h-5 text-gray-600" />}
          title="Dark Mode"
          description="Toggle dark mode theme"
        >
          <div className="flex items-center">
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" className="sr-only peer" />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>
        </SettingItem>
      </div>
    </div>
  );
};

export default Settings;
