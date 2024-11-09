import React, { useState } from "react";
import StoringService from "../../../services/db";
import EncryptionService from "../../../services/Keys-managment/Encrypt";
import { KeySet, EncryptedPassword } from "../../../services/types";
import { Input } from "../ui/input";

const CreateAccount: React.FC = () => {
  const [website, setWebsite] = useState("");
  const [authToken, setAuthToken] = useState("");
  const [error, setError] = useState("");

  const handleCreateAccount = async () => {};

  return (
    <div>
      <h2>Create a New Account</h2>
      <label>
        Website Address:
        <Input
          type="text"
          value={website}
          onChange={(e) => setWebsite(e.target.value)}
        />
      </label>
      <label>
        Auth Token:
        <Input
          type="text"
          value={authToken}
          onChange={(e) => setAuthToken(e.target.value)}
        />
      </label>
      {error && <div style={{ color: "red" }}>{error}</div>}
      <button onClick={handleCreateAccount}>Create Account</button>
    </div>
  );
};

export default CreateAccount;
