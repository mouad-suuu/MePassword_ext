import React, { useState } from "react";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import { SessionManagementService } from "../../../services/sessionManagment/SessionManager";
import EncryptionService from "../../../services/EncryptionService";
import Main from "../main";

export const PasswordPrompt: React.FC = () => {
  const [password, setPassword] = useState<string>("");
  const [isValid, setIsValid] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await handleValidatePassword(password);
  };

  const handleValidatePassword = async (password: string) => {
    const valid = await EncryptionService.API.validatePassword(password);
    if (valid) {
      //   await SessionManagementService.initialize(password);
      setIsValid(true);
    } else {
      setErrorMessage("Invalid password. Please try again.");
      setPassword("");
    }
  };

  return (
    <>
      {!isValid ? (
        <div className="password-prompt">
          <h2>Please enter your password</h2>
          {errorMessage && (
            <div className="text-red-500 mb-4">{errorMessage}</div>
          )}
          <form onSubmit={handleSubmit}>
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <Button type="submit">Submit</Button>
          </form>
        </div>
      ) : (
        <Main />
      )}
    </>
  );
};
export default PasswordPrompt;
