import React, { useEffect, useState } from 'react';

interface LogoProps {
  size?: 'small' | 'medium' | 'large';
  clickable?: boolean;
}

export const Logo: React.FC<LogoProps> = ({ size = 'medium', clickable = false }) => {
  const [logoUrl, setLogoUrl] = useState<string>('');

  useEffect(() => {
    // Get the correct URL for the image in the extension
    const url = chrome.runtime.getURL('assets/MePasswod.png');
    setLogoUrl(url);
  }, []);

  const LogoImage = () => (
    <img
      src={logoUrl}
      alt="MePassword Logo"
      width={size === 'small' ? 16 : size === 'medium' ? 48 : 128}
      height={size === 'small' ? 16 : size === 'medium' ? 48 : 128}
      className="rounded-sm"
    />
  );

  if (clickable) {
    return (
      <a 
        href="https://me-password-web.vercel.app" 
        target="_blank" 
        rel="noopener noreferrer"
        className="flex items-center space-x-2 hover:opacity-80 transition-opacity"
      >
        <LogoImage />
      </a>
    );
  }

  return (
    <div className="flex items-center space-x-2">
      <LogoImage />
    </div>
  );
};