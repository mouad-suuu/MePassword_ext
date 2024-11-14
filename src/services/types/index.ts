// Types to be saved localy and by the user
export interface KeySet {
  privateKey: string;
  AESKey: string;
  IV: string;
  Credentials: UserCredentials;
}
export interface SessionSettings {
  pushNotifications: boolean; // Toggle notifications
  autoLockTime: number; // Time in ms or mins before auto-lock
  autoLockStart: number; // Timestamp of last auto-lock
  sessionStart: number; // Timestamp when session started
  sessionTime: number; // Total session time allowed before logout
  sessionExpiry?: number; // Timestamp for scheduled session expiration
  lastAccessTime?: number; // Timestamp of last session access (for inactivity checks)
  biometricVerification: boolean; // Use biometrics for verification
  biometricType: "face" | "fingerprint"; // Supported biometric types
  biometricPassword?: string; // Fallback password if biometrics fail
  lockOnLeave?: boolean; // Auto-lock on window blur/focus loss
}
// Keys to be genetated
export interface EncryptionKeys {
  RSAkeys: AsymmetricKeys;
  AESKey: SymmetricKeys;
}

// types to be sent to the server as settings (well be updated but later we dont need much now)
export interface APISettingsPayload {
  publicKey: string;
  password: string | undefined;
  deviceId: string;
  timestamp: number;
  sessionSettings?: {
    pushNotifications: boolean;
    autoLockTime: number;
    sessionTime: number;
    lastAccessTime?: number;
  };
}

// types to be sent to the server as passwords and keys

export interface NewEncryptedPassword {
  id: string;
  website: string;
  user: string;
  password: string;
  MetaData?: PasswordMetadata;
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

export interface SymmetricKeys {
  key: string;
  algorithm: "AES-GCM";
  length: 256;
  iv: string;
}

export interface UserCredentials {
  server: string;
  authToken: string;
  password?: string;
}

// types to be used in the future ignore them
interface AuditLog {
  id: string;
  timestamp: number;
  action: "create" | "read" | "update" | "delete" | "login" | "logout";
  userId: string;
  resourceType: "password" | "key";
  resourceId: string;
  metadata: {
    ip: string;
    userAgent: string;
    success: boolean;
    failureReason?: string;
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
export type SetupStage =
  | "initial"
  | "github-setup"
  | "app-setup"
  | "key-generation"
  | "complete";
interface APICredentials {
  website: string;
  authToken: string;
  password: string;
}
