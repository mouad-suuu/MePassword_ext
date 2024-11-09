export interface ExtensionSettings {
  serverUrl: string;
  authToken: string;
  dataRetentionTime: number;
  autoLockTime: number;
  biometricEnabled: boolean;

  theme: "light" | "dark";
  autoFill: boolean;
}

export interface InitialSetupData {
  githubUsername: string;
  deployedAppUrl: string;
  authKey: string;
}

export type SetupStage =
  | "initial"
  | "github-setup"
  | "app-setup"
  | "key-generation"
  | "complete";

export interface EncryptionKeys {
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

export interface KeySet {
  id: string;
  version: number;
  created: number;
  lastRotated: number;
  encryption: EncryptionKeys;
  dataKey: SymmetricKeys;
  biometric?: {
    key: string;
    type: "fingerprint" | "faceid" | "other";
    verified: boolean;
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

export interface EncryptedPassword extends PasswordMetadata {
  encryptedData: {
    website: string;
    authToken: string;
    password: string;
    notes?: string;
  };
  iv: string;
  algorithm: "AES-GCM";
  keyId: string;
}
export interface UserCredentials {
  website: string;
  authToken: string;
  password: string;
  notes?: string;
}
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
