import React, { useState } from "react";
import { Input } from "../ui/input";
import { Button } from "../ui/button";

interface PasswordPromptProps {
  onSubmit: (password: string) => void;
  error?: string | null;
}

export const PasswordPrompt: React.FC<PasswordPromptProps> = ({ onSubmit }) => {
  const [password, setPassword] = useState<string>("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(password);
  };

  return (
    <div className="password-prompt">
      <h2>Please enter your password</h2>
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
  );
};
