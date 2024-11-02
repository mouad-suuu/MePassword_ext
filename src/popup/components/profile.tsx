import React from "react";
import { Mail, Key, Shield } from "lucide-react";

interface ProfileSectionProps {
  icon: React.ReactNode;
  title: string;
  content: string;
}

const ProfileSection: React.FC<ProfileSectionProps> = ({
  icon,
  title,
  content,
}) => (
  <div className="flex items-start space-x-3 p-4 bg-white rounded-lg shadow">
    <div className="p-2 bg-blue-50 rounded-full">{icon}</div>
    <div>
      <h3 className="font-medium text-gray-800">{title}</h3>
      <p className="text-sm text-gray-600">{content}</p>
    </div>
  </div>
);

interface ProfileProps {
  settings: any; // Replace 'any' with the actual settings type if known
}

const Profile: React.FC<ProfileProps> = ({ settings }) => {
  return (
    <div className="space-y-4">
      <div className="flex items-center space-x-4 mb-6">
        <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center">
          <span className="text-2xl text-white font-semibold">JD</span>
        </div>
        <div>
          <h2 className="text-xl font-semibold text-gray-800">John Doe</h2>
          <p className="text-sm text-gray-600">Premium Account</p>
        </div>
      </div>

      <div className="space-y-3">
        <ProfileSection
          icon={<Mail className="w-5 h-5 text-blue-600" />}
          title="Email"
          content="john.doe@example.com"
        />
        <ProfileSection
          icon={<Key className="w-5 h-5 text-blue-600" />}
          title="Password Last Changed"
          content="2 months ago"
        />
        <ProfileSection
          icon={<Shield className="w-5 h-5 text-blue-600" />}
          title="Two-Factor Authentication"
          content="Enabled"
        />
      </div>

      <button className="w-full mt-6 bg-gray-100 text-gray-600 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors">
        Sign Out
      </button>
    </div>
  );
};

export default Profile;
