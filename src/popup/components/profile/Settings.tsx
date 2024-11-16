import React, { ReactNode } from "react";
import { Bell, Lock, Shield, Moon } from "lucide-react";
import { useState, useEffect } from "react";
import { SessionManagementService } from "../../../services/sessionManagment/SessionManager";
import { KeyStorage } from "../../../services/storage/KeyStorage";

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

export const SettingsComponent: React.FC = () => {
  const [settings, setSettings] = useState({
    pushNotifications: false,
    autoLockTime: 300000, // 5 minutes default
    sessionTime: 432000000, // 5 days default
  });

  useEffect(() => {
    // Load initial settings
    const loadSettings = async () => {
      const sessionSettings =
        await SessionManagementService.getSessionSettings();
      setSettings({
        pushNotifications: sessionSettings.pushNotifications,
        autoLockTime: sessionSettings.autoLockTime,
        sessionTime: sessionSettings.sessionTime,
      });
    };
    loadSettings();
  }, []);

  const handleSettingChange = async (key: string, value: any) => {
    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings);

    // Update session settings
    await SessionManagementService.updateSessionSettings({
      ...(await SessionManagementService.getSessionSettings()),
      [key]: value,
    });
  };

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
              <input
                type="checkbox"
                className="sr-only peer"
                checked={settings.pushNotifications}
                onChange={(e) =>
                  handleSettingChange("pushNotifications", e.target.checked)
                }
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>
        </SettingItem>

        <SettingItem
          icon={<Lock className="w-5 h-5 text-gray-600" />}
          title="Auto-Lock"
          description="Automatically lock after inactivity"
        >
          <select
            className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 p-2.5"
            value={settings.autoLockTime / 60000} // Convert to minutes
            onChange={(e) =>
              handleSettingChange(
                "autoLockTime",
                Number(e.target.value) * 60000
              )
            }
          >
            <option value="5">5 minutes</option>
            <option value="10">10 minutes</option>
            <option value="30">30 minutes</option>
          </select>
        </SettingItem>

        <SettingItem
          icon={<Lock className="w-5 h-5 text-gray-600" />}
          title="Session time"
          description="Automatically Delete all the data from the browser (you'll need to enter the keys again)"
        >
          <select
            className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 p-2.5"
            value={settings.sessionTime / 86400000} // Convert to days
            onChange={(e) =>
              handleSettingChange(
                "sessionTime",
                Number(e.target.value) * 86400000
              )
            }
          >
            <option value="5">5 days</option>
            <option value="10">10 days</option>
            <option value="30">30 days</option>
            <option value="60">60 days</option>
            <option value="90">90 days</option>
          </select>
        </SettingItem>
      </div>
    </div>
  );
};
