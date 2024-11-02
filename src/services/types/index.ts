export interface ExtensionSettings {
  serverUrl: string;
  authToken: string;
  dataRetentionTime: number;
  useBiometricAuth: boolean;
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
interface EncryptionKeys {
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

interface SymmetricKeys {
  key: string;
  algorithm: "AES-GCM";
  length: 256;
  iv: string;
}

interface KeySet {
  id: string;
  version: number;
  created: number;
  lastRotated: number;
  encryption: EncryptionKeys;
  websiteKey: SymmetricKeys;
  authKey: SymmetricKeys;
  dataKey: SymmetricKeys;
  biometric?: {
    key: string;
    type: "fingerprint" | "faceid" | "other";
    verified: boolean;
  };
}
interface PasswordMetadata {
  id: string;
  createdAt: number;
  modifiedAt: number;
  lastAccessed: number;
  version: number;
  strength: "weak" | "medium" | "strong";
}

interface EncryptedPassword extends PasswordMetadata {
  encryptedData: {
    website: string;
    username: string;
    password: string;
    notes?: string;
  };
  iv: string;
  algorithm: "AES-GCM";
  keyId: string;
  accessControl?: {
    teamIds: string[];
    userIds: string[];
    permissions: ("read" | "write" | "share")[];
  };
}
interface Organization {
  id: string;
  encryptedName: string;
  settings: {
    passwordPolicy: {
      minLength: number;
      requireSpecialChars: boolean;
      requireNumbers: boolean;
      requireUppercase: boolean;
      maxAge: number;
    };
    mfaRequired: boolean;
    sessionTimeout: number;
  };
  teams: Team[];
  vaults: PasswordMetadata[];
}

interface Team {
  id: string;
  encryptedName: string;
  permissions: {
    role: "admin" | "manager" | "member";
    allowedOperations: ("read" | "write" | "share" | "audit")[];
  };
  members: TeamMember[];
}

interface TeamMember {
  userId: string;
  publicKey: string;
  encryptedTeamKey: string;
  role: "admin" | "member";
  joinedAt: number;
}
interface AuditLog {
  id: string;
  timestamp: number;
  action:
    | "create"
    | "read"
    | "update"
    | "delete"
    | "share"
    | "login"
    | "logout";
  userId: string;
  resourceType: "password" | "team" | "vault" | "key";
  resourceId: string;
  metadata: {
    ip: string;
    userAgent: string;
    location?: string;
    success: boolean;
    failureReason?: string;
  };
}

interface SecurityEvent {
  id: string;
  severity: "low" | "medium" | "high" | "critical";
  type:
    | "unauthorized_access"
    | "brute_force"
    | "suspicious_ip"
    | "key_compromise";
  timestamp: number;
  details: Record<string, unknown>;
  resolved: boolean;
  resolvedBy?: string;
  resolution?: string;
}

export interface ExtensionSettings {
  serverUrl: string;
  authToken: string;
  dataRetentionTime: number;
  useBiometricAuth: boolean;
  theme: "light" | "dark";
  autoFill: boolean;
}

export interface InitialSetupData {
  githubUsername: string;
  deployedAppUrl: string;
  authKey: string;
}
