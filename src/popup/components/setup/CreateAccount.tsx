import React, { useState } from "react";
import { UserCredentials } from "../../../services/types";
import { Button } from "../ui/button";

type CreateAccountProps = {
  onCreateAccount: (credentials: UserCredentials) => void;
};

const CreateAccount: React.FC<CreateAccountProps> = ({ onCreateAccount }) => {
  const [credentials, setCredentials] = useState<UserCredentials>({
    website: "",
    authToken: "",
    password: "",
  });
  const [confirmPassword, setConfirmPassword] = useState("");

  const handleCreateAccount = () => {
    if (credentials.password === confirmPassword) {
      onCreateAccount(credentials);
    } else {
      alert("Passwords do not match");
    }
  };

  return (
    <div>
      <h2>Create Account</h2>
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
        placeholder="Create Password"
      />
      <input
        type="password"
        value={confirmPassword}
        onChange={(e) => setConfirmPassword(e.target.value)}
        placeholder="Confirm Password"
      />
      <Button onClick={handleCreateAccount}>Create Account</Button>
    </div>
  );
};

export default CreateAccount;
