import React, { useState } from "react";
import { Button } from "../ui/button";

type EnterKeysProps = {
  onEnterKeys: (keys: string) => void;
};

const EnterKeys: React.FC<EnterKeysProps> = ({ onEnterKeys }) => {
  const [keys, setKeys] = useState("");

  const handleEnterKeys = () => {
    onEnterKeys(keys);
  };

  return (
    <div>
      <h2>Enter Encryption Keys</h2>
      <textarea
        value={keys}
        onChange={(e) => setKeys(e.target.value)}
        placeholder="Enter Your Encryption Keys"
      />
      <Button onClick={handleEnterKeys}>Submit</Button>
    </div>
  );
};

export default EnterKeys;
