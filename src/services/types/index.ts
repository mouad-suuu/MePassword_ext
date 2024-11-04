/**
 * Configuration settings for the browser extension
 * @property serverUrl - Base URL of the password manager server
 * @property authToken - Authentication token for API requests
 * @property dataRetentionTime - Duration in days to retain local data
 * @property useBiometricAuth - Whether biometric authentication is enabled
 * @property theme - UI theme preference
 * @property autoFill - Whether automatic form filling is enabled
 */
export interface ExtensionSettings {
  serverUrl: string;
  authToken: string;
  dataRetentionTime: number;
  useBiometricAuth: boolean;
  theme: "light" | "dark";
  autoFill: boolean;
}

/**
 * Data required for initial application setup
 * @property githubUsername - GitHub account for deployment
 * @property deployedAppUrl - URL where the app is hosted
 * @property authKey - Initial authentication key
 */
export interface InitialSetupData {
  githubUsername: string;
  deployedAppUrl: string;
  authKey: string;
}

/**
 * Represents different stages of the setup process
 */
export type SetupStage =
  | "initial"
  | "github-setup"
  | "app-setup"
  | "key-generation"
  | "complete";

/**
 * RSA key pair used for asymmetric encryption
 * @property publicKey - Public key configuration for encryption
 * @property privateKey - Private key configuration for decryption
 */
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

/**
 * AES key configuration for symmetric encryption
 * @property key - Base64 encoded encryption key
 * @property algorithm - Encryption algorithm (AES-GCM)
 * @property length - Key length in bits
 * @property iv - Initialization vector for encryption
 */
export interface SymmetricKeys {
  key: string;
  algorithm: "AES-GCM";
  length: 256;
  iv: string;
}

/**
 * Complete set of encryption keys used by the application
 * @property id - Unique identifier for the key set
 * @property version - Key set version number
 * @property created - Timestamp of creation
 * @property lastRotated - Timestamp of last key rotation
 * @property encryption - RSA key pair
 * @property websiteKey - Symmetric key for website data
 * @property authKey - Symmetric key for authentication
 * @property dataKey - Symmetric key for user data
 * @property biometric - Optional biometric authentication configuration
 */
export interface KeySet {
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

/**
 * Base metadata for stored passwords
 * @property id - Unique identifier
 * @property createdAt - Creation timestamp
 * @property modifiedAt - Last modification timestamp
 * @property lastAccessed - Last access timestamp
 * @property version - Password version number
 * @property strength - Password strength classification
 */
interface PasswordMetadata {
  id: string;
  createdAt: number;
  modifiedAt: number;
  lastAccessed: number;
  version: number;
  strength: "weak" | "medium" | "strong";
}

/**
 * Encrypted password entry with metadata
 * @extends PasswordMetadata
 * @property encryptedData - Encrypted password information
 * @property iv - Initialization vector used for encryption
 * @property algorithm - Encryption algorithm used
 * @property keyId - ID of the key used for encryption
 * @property accessControl - Optional access control settings
 */
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

/**
 * Organization configuration and structure
 * @property id - Unique organization identifier
 * @property encryptedName - Encrypted organization name
 * @property settings - Organization-wide settings
 * @property teams - List of teams in the organization
 * @property vaults - List of password vaults
 */
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

/**
 * Team configuration within an organization
 * @property id - Unique team identifier
 * @property encryptedName - Encrypted team name
 * @property permissions - Team-wide permissions
 * @property members - List of team members
 */
interface Team {
  id: string;
  encryptedName: string;
  permissions: {
    role: "admin" | "manager" | "member";
    allowedOperations: ("read" | "write" | "share" | "audit")[];
  };
  members: TeamMember[];
}

/**
 * Team member information
 * @property userId - Unique user identifier
 * @property publicKey - Member's public key for encryption
 * @property encryptedTeamKey - Encrypted team key for this member
 * @property role - Member's role in the team
 * @property joinedAt - Timestamp when member joined
 */
interface TeamMember {
  userId: string;
  publicKey: string;
  encryptedTeamKey: string;
  role: "admin" | "member";
  joinedAt: number;
}

/**
 * Security audit log entry
 * @property id - Unique log identifier
 * @property timestamp - Event timestamp
 * @property action - Type of action performed
 * @property userId - User who performed the action
 * @property resourceType - Type of resource affected
 * @property resourceId - Identifier of affected resource
 * @property metadata - Additional event information
 */
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

/**
 * Security event notification
 * @property id - Unique event identifier
 * @property severity - Event severity level
 * @property type - Type of security event
 * @property timestamp - Event timestamp
 * @property details - Additional event details
 * @property resolved - Whether the event has been resolved
 * @property resolvedBy - User who resolved the event
 * @property resolution - Description of how event was resolved
 */
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
