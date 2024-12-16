import React, { useEffect, useState } from 'react';
import { useClerk, useUser } from "@clerk/chrome-extension";
import { RefreshCw, Laptop, Smartphone, Tablet } from "lucide-react";
import { Button } from "../../components/ui/button";
import { NetworkSecurityService } from "../../../services/auth&security/NetworkSecurityService";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "../../components/ui/dialog";
import { AlertCircle } from "lucide-react";

interface Device {
  id: string;
  browser: string;
  os: string;
  deviceName?: string;
  lastActive: string;
  sessionActive: boolean;
}

export default function DeviceAudit() {
  const { user } = useUser();
  const [devices, setDevices] = useState<Device[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deactivating, setDeactivating] = useState(false);
  const networkSecurity = NetworkSecurityService.getInstance();
  const [sessionIds, setSessionIds] = useState<string[]>([]);
  const { signOut } = useClerk();

  const handleSignOutAllDevices = async () => {
    try {
      // Sign out from all sessions using removeSessions
      await signOut();
    } catch (err) {
      console.error("Error signing out from all devices:", err);
      setError(err instanceof Error ? err.message : 'Failed to sign out from all devices');
    }
  };

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
      console.log("[DeviceAudit] Fetched devices:", data);
      setDevices(data.devices || []);
    } catch (err) {
      console.error("[DeviceAudit] Error fetching devices:", err);
      setError(err instanceof Error ? err.message : 'Failed to load devices');
      setDevices([]); // Initialize to empty array on error
    } finally {
      setLoading(false);
    }
  };

  const deactivateAllDevices = async () => {
    try {
      setDeactivating(true);
      const response = await networkSecurity.secureRequest(
        '/api/devices',
        {
          method: 'POST',
          body: JSON.stringify({ action: 'deactivateAll' })
        }
      );

      if (!response.ok) {
        throw new Error('Failed to sign out all devices');
      }

      await fetchDevices();
      setConfirmOpen(false);
    } catch (err) {
      console.error("[DeviceAudit] Error deactivating devices:", err);
      setError(err instanceof Error ? err.message : 'Failed to sign out devices');
    } finally {
      setDeactivating(false);
    }
  };

  const getDeviceIcon = (device: Device) => {
    const os = device.os.toLowerCase();
    if (os.includes('android') || os.includes('ios')) return <Smartphone className="w-5 h-5" />;
    if (os.includes('ipad') || os.includes('tablet')) return <Tablet className="w-5 h-5" />;
    return <Laptop className="w-5 h-5" />;
  };

  const getDeviceName = (device: Device) => {
    if (device.deviceName) return device.deviceName;
    return `${device.browser} on ${device.os}`;
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
        {devices?.map((device) => (
          <div
            key={device.id}
            className="flex items-center justify-between p-3 bg-white rounded-lg border"
          >
            <div className="flex items-center gap-3">
              {getDeviceIcon(device)}
              <div>
                <p className="font-medium">{getDeviceName(device)}</p>
                <p className="text-xs text-gray-400">
                  Last active: {new Date(device.lastActive).toLocaleString()}
                </p>
              </div>
            </div>
          </div>
        ))}

        {(!devices || devices.length === 0) && (
          <p className="text-center text-gray-500 py-4">
            No devices found
          </p>
        )}
      </div>
      <Button
        variant="destructive"
        size="sm"
        onClick={handleSignOutAllDevices}
        className="w-full mt-4"
      >
        Sign Out All Devices
      </Button>
      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Sign Out All Devices?</DialogTitle>
            <DialogDescription>
              This will sign you out from all devices where you're currently logged in. 
              You'll need to sign in again on each device.
            </DialogDescription>
          </DialogHeader>
          {error && (
            <div className="flex items-center gap-2 text-red-500 text-sm">
              <AlertCircle className="w-4 h-4" />
              {error}
            </div>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setConfirmOpen(false)}
              disabled={deactivating}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={deactivateAllDevices}
              disabled={deactivating}
            >
              {deactivating ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin mr-2" />
                  Signing Out...
                </>
              ) : (
                'Sign Out All'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
