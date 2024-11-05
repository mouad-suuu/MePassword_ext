import React, { useState } from "react";
import { UserCredentials } from "../../../services/types";
import { Button } from "../ui/button";

type AuthEntryProps = {
  onAuthenticate: (credentials: UserCredentials) => void;
  onBiometricAuth: (biometricData: string) => void;
};

const AuthEntry: React.FC<AuthEntryProps> = ({
  onAuthenticate,
  onBiometricAuth,
}) => {
  const [credentials, setCredentials] = useState<UserCredentials>({
    website: "",
    authToken: "",
    password: "",
  });

  const handlePasswordSubmit = () => {
    onAuthenticate(credentials);
  };

  const handleBiometricAuth = async () => {
    try {
      // In a real implementation, this would use the Web Authentication API
      const biometricData = await navigator.credentials.get({
        publicKey: {
          challenge: new Uint8Array(32),
          rpId: window.location.hostname,
          userVerification: "required",
        },
      });
      onBiometricAuth(JSON.stringify(biometricData));
    } catch (error) {
      alert("Biometric authentication failed: " + (error as Error).message);
    }
  };

  return (
    <div>
      <h2>Authenticate</h2>
      <input
        type="text"
        value={credentials.website}
        onChange={(e) =>
          setCredentials({ ...credentials, website: e.target.value })
        }
        placeholder="Website URL"
      />
      <input
        type="text"
        value={credentials.authToken}
        onChange={(e) =>
          setCredentials({ ...credentials, authToken: e.target.value })
        }
        placeholder="Auth Token"
      />
      <input
        type="password"
        value={credentials.password}
        onChange={(e) =>
          setCredentials({ ...credentials, password: e.target.value })
        }
        placeholder="Enter Password"
      />
      <Button onClick={handlePasswordSubmit}>Enter</Button>
      <Button onClick={handleBiometricAuth}>Use Biometric</Button>
    </div>
  );
};

export default AuthEntry;
