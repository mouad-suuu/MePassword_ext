import React, { useEffect, useState } from 'react';
import { useUser } from "@clerk/chrome-extension";
import { RefreshCw, Laptop, Trash2 } from "lucide-react";
import { Button } from "../../components/ui/button";
import { NetworkSecurityService } from "../../../services/auth&security/NetworkSecurityService";

interface Device {
  id: string;
  browser: string;
  os: string;
  lastActive: string;
  sessionActive: boolean;
}

export default function DeviceAudit() {
  const { user } = useUser();
  const [devices, setDevices] = useState<Device[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const networkSecurity = NetworkSecurityService.getInstance();

  const fetchDevices = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await networkSecurity.secureRequest(
        `/api/devices?userId=${encodeURIComponent(user?.id || '')}`,
        {
          method: 'GET'
        }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch devices');
      }

      const data = await response.json();
      setDevices(data.devices);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load devices');
    } finally {
      setLoading(false);
    }
  };

  const removeDevice = async (deviceId: string) => {
    try {
      const response = await networkSecurity.secureRequest(
        `/api/devices?deviceId=${encodeURIComponent(deviceId)}`,
        {
          method: 'DELETE'
        }
      );

      if (!response.ok) {
        throw new Error('Failed to remove device');
      }

      // Refresh device list
      fetchDevices();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to remove device');
    }
  };

  useEffect(() => {
    if (user?.id) {
      fetchDevices();
    }
  }, [user?.id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-4">
        <RefreshCw className="w-6 h-6 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-red-500 p-4">
        {error}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Device Audit</h3>
        <Button
          variant="outline"
          size="sm"
          onClick={() => fetchDevices()}
          className="flex items-center gap-2"
        >
          <RefreshCw className="w-4 h-4" />
          Refresh
        </Button>
      </div>

      <div className="space-y-3">
        {devices.map((device) => (
          <div
            key={device.id}
            className="flex items-center justify-between p-3 bg-white rounded-lg border"
          >
            <div className="flex items-center gap-3">
              <Laptop className="w-5 h-5 text-gray-500" />
              <div>
                <p className="font-medium">{device.browser}</p>
                <p className="text-sm text-gray-500">{device.os}</p>
                <p className="text-xs text-gray-400">
                  Last active: {new Date(device.lastActive).toLocaleString()}
                </p>
              </div>
            </div>
            
            {!device.sessionActive && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => removeDevice(device.id)}
                className="text-red-500 hover:text-red-600"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            )}
          </div>
        ))}

        {devices.length === 0 && (
          <p className="text-center text-gray-500 py-4">
            No devices found
          </p>
        )}
      </div>
    </div>
  );
}
