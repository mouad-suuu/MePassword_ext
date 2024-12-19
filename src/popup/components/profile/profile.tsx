import React, { useState, useEffect } from "react";
import { Mail, Key, Shield, Monitor, Clock, AlertTriangle } from "lucide-react";
import { useUser } from "@clerk/chrome-extension";
import DeviceAudit from "./DeviceAudit";
import { Device } from "../../../services/types";

interface ProfileSectionProps {
  icon: React.ReactNode;
  title: string;
  content: string | React.ReactNode;
  className?: string;
}

const ProfileSection: React.FC<ProfileSectionProps> = ({
  icon,
  title,
  content,
  className,
}) => (
  <div className={`flex items-start space-x-3 p-4 bg-white rounded-lg shadow ${className}`}>
    <div className="p-2 bg-blue-50 rounded-full">{icon}</div>
    <div className="flex-1">
      <h3 className="font-medium text-lg text-gray-800">{title}</h3>
      <div className="text-sm mt-4 text-gray-600 w-full">{content}</div>
    </div>
  </div>
);

const Profile = () => {
  const { user, isLoaded } = useUser();
  const [devices, setDevices] = useState<Device[]>([]);

  if (!isLoaded) {
    return <div className="p-4">Loading...</div>;
  }

  return (
    <div className="space-y-4 max-h-[600px] overflow-y-auto p-4">
      <div className="flex items-center space-x-4 mb-6">
        <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center">
          {user?.imageUrl ? (
            <img 
              src={user.imageUrl} 
              alt={user.fullName || 'Profile'} 
              className="w-full h-full rounded-full object-cover"
            />
          ) : (
            <span className="text-2xl text-white font-semibold">
              {user?.fullName?.substring(0, 2).toUpperCase() || 'U'}
            </span>
          )}
        </div>
        <div>
          <h2 className="text-xl font-semibold text-gray-800">
            {user?.fullName || 'User'}
          </h2>
          <p className="text-sm text-gray-600">{user?.primaryEmailAddress?.emailAddress}</p>
          {user?.createdAt && (
            <p className="text-xs text-gray-500">
              Member since {new Date(user.createdAt).toLocaleDateString()}
            </p>
          )}
        </div>
      </div>

      <div className="space-y-3">
        <DeviceAudit />
        
        <ProfileSection
          icon={<AlertTriangle className="w-5 h-5 text-yellow-600" />}
          title="Security Recommendations"
          content={
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-5 h-5 mt-0.5 text-blue-600">
                  <Shield className="w-full h-full" />
                </div>
                <p className="text-sm text-gray-600">Review your connected devices regularly to ensure account security</p>
              </div>

              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-5 h-5 mt-0.5 text-blue-600">
                  <Shield className="w-full h-full" />
                </div>
                <p className="text-sm text-gray-600">Keep your backup file in multiple secure locations. Don't worry - it's encrypted with your password!</p>
              </div>

              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-5 h-5 mt-0.5 text-blue-600">
                  <Shield className="w-full h-full" />
                </div>
                <div className="text-sm text-gray-600">
                  <p className="mb-1">Create strong, unique passwords for each site using a consistent pattern:</p>
                  <p className="ml-4 text-gray-500 italic">Example: YourName + SiteName + FavoriteNumber/Color</p>
                </div>
              </div>
            </div>
          }
        />
      </div>
    </div>
  );
};

export default Profile;
