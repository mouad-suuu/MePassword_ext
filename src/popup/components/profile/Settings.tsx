import React, { ReactNode } from "react";
import { Bell, Lock, Shield, Moon, Fingerprint } from "lucide-react";
import { useState, useEffect } from "react";
import { SessionManagementService } from "../../../services/sessionManagment/SessionManager";
import { KeyStorage } from "../../../services/storage/KeyStorage";
import EncryptionService from "../../../services/EncryptionService";
import { theme } from "../../them";

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
    autoLockTime: 300000,
    sessionTime: 432000000,
    biometricVerification: false,
  });

  useEffect(() => {
    // Load initial settings
    const loadSettings = async () => {
      const respose = await EncryptionService.API.SettingGet();
      const settings = await respose.json();
      const sessionSettings = settings.settings.sessionSettings;

      setSettings({
        pushNotifications: sessionSettings.pushNotifications,
        autoLockTime: sessionSettings.autoLockTime,
        sessionTime: sessionSettings.sessionTime,
        biometricVerification: sessionSettings.biometricVerification,
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

  const handleBiometricToggle = async (checked: boolean) => {
    try {
      const sessionManager = new SessionManagementService();
      await sessionManager.configureBiometric(checked);

      // Update local state immediately after successful configuration
      setSettings((prev) => ({
        ...prev,
        biometricVerification: checked,
      }));

      // Refresh settings from storage
      const updatedSettings = await KeyStorage.getSettingsFromStorage();
    } catch (error) {
      console.error("Failed to configure biometric:", error);
      // Revert the checkbox if there's an error
      setSettings((prev) => ({
        ...prev,
        biometricVerification: !checked,
      }));
      // Show error message to user
      // You can add a toast notification here
    }
  };

  const handleLogout = async () => {
    try {
      await SessionManagementService.clearSession();
      // You might want to redirect to login page or refresh the extension
      window.location.reload();
    } catch (error) {
      console.error("Failed to logout:", error);
      // Handle error (maybe show a toast notification)
    }
  };

  return (
    <div className="space-y-4">
      <h2 className={theme.text.heading}>Settings</h2>

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
            value={String(settings.autoLockTime / 60000)} // Convert to string to match option values
            onChange={(e) =>
              handleSettingChange(
                "autoLockTime",
                Number(e.target.value) * 60000
              )
            }
          >
            <option value="0.5">30 seconds</option>
            <option value="5">5 minutes</option>
            <option value="10">10 minutes</option>
            <option value="30">30 minutes</option>
            <option value="60">1 hour</option>
          </select>
        </SettingItem>

        <SettingItem
          icon={<Lock className="w-5 h-5 text-gray-600" />}
          title="Session time"
          description="Automatically Delete all the data from the browser (you'll need to enter the keys again)"
        >
          <select
            className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 p-2.5"
            value={String(settings.sessionTime / 86400000)} // Convert to string to match option values
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
            <option value="180">180 days</option>
            <option value="360">360 days</option>
          </select>
        </SettingItem>

        <SettingItem
          icon={<Fingerprint className="w-5 h-5 text-gray-600" />}
          title="Biometric Authentication"
          description="Use Windows Hello or Touch ID for quick access"
        >
          <div className="flex items-center">
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                className="sr-only peer"
                checked={settings.biometricVerification}
                onChange={(e) => handleBiometricToggle(e.target.checked)}
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>
        </SettingItem>

        <button
          onClick={handleLogout}
          className="w-full py-2 px-4 bg-red-500 hover:bg-red-600 text-white font-medium rounded-lg transition-colors duration-200"
        >
          Logout
        </button>
      </div>
    </div>
  );
};
