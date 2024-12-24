// Types to be saved localy and by the user

// in windows hello
export interface KeySet {
  privateKey: string;
  AESKey: string;
  IV: string;
  Credentials: UserCredentials;
}

// in browser storage
export interface SessionSettings {
  pushNotifications: boolean;
  autoLockTime: number;
  autoLockStart: number;
  sessionStart: number;
  sessionTime: number;
  sessionExpiry?: number;
  lastAccessTime?: number;
  biometricVerification: boolean;
  biometricType: "face" | "fingerprint" | "none";
  biometricPassword?: string;
  lockOnLeave?: boolean;
  lastUpdated?: number;
}

// encryption Keys to be genetated
export interface EncryptionKeys {
  RSAkeys: AsymmetricKeys;
  AESKey: SymmetricKeys;
}

// types to be sent to the server as settings (well be updated but later we dont need much now)
export interface APISettingsPayload {
  publicKey: string;
  userId: string;
  password: string | undefined;
  deviceId: string;
  timestamp: number;
  sessionSettings?: SessionSettings;
}
export type BiometricType = "face" | "fingerprint" | "none";
// types to be sent to the server as passwords and keys, and the encrypted once are : websirte, user, password
// and the rest is saved as it is

export interface NewEncryptedPassword {
  id: string;
  website: string;
  user: string;
  encrypted_password?: string;
  password: string;
  owner_email: string;
  owner_id?: string;
  updated_at?: string;
  MetaData?: PasswordMetadata;
}
export interface Device {
  id: string;
  userId: string;
  browser: string;
  os: string;
  lastActive: Date;
  sessionActive: boolean;
}
// types used in other types needed

export interface AsymmetricKeys {
  publicKey: {
    key: string;
    algorithm: "RSA-OAEP";
    length: 4096;
    format: "spki";
  };
  privateKey: {
    key: string;
    algorithm: "RSA-OAEP";
    length: 4096;
    format: "pkcs8";
    protected: boolean;
  };
}
export interface PasswordMetadata {
  id: string;
  createdAt: number;
  modifiedAt: number;
  lastAccessed: number;
  version: number;
  strength: "weak" | "medium" | "strong";
}
export interface SymmetricKeys {
  key: string;
  algorithm: "AES-GCM";
  length: 256;
  iv: string;
}

export interface UserCredentials {
  authToken: string;
  email: string;
  username: string;
  password: string;
  userId:string;
}



export interface LoginFormData {
  url: string;
  title: string;
  timestamp: string;
}
