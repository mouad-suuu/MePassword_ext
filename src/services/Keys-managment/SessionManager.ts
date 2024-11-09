// /**
//  * TODO:
//  * this file will manage the session of the user, the session time and the deletion of the data from the local storage when the user log out and when the time been set is over(default 30 days but changable by the user in the settings)
//  * * Session Management Service
//  * TODO: Implement the following functionalities:
//  * 1. Session Control:
//  *    - Handle session initialization
//  *    - Manage session duration
//  *    - Implement biometric verification
//  *    - Handle multi-device sessions
//  *
//  * 2. Security Timeouts:
//  *    - Configurable session expiration
//  *    - Automatic logout triggers
//  *    - Idle detection
//  *    - Emergency lockout
//  *
//  * 3. State Management:
//  *    - Track authentication status
//  *    - Handle organization sessions
//  *    - Manage shared vault access
//  *    - Control API access tokens
//  *
//  * 4. Integration:
//  *    - Coordinate with key rotation
//  *    - Handle offline session validation
//  *    - Manage push notifications
//  */
// import DatabaseService from "../db";
// import EncryptionService from "../Keys-managment/Encrypt";
// import { KeySet, ExtensionSettings, EncryptedPassword } from "../types";

// class SessionManager {
//   public static _instance: SessionManager;
//   private _currentSession: {
//     userId: string;
//     keySet: KeySet;
//     settings: ExtensionSettings;
//     expiresAt: number;
//   } | null = null;

//   private constructor() {}

//   public static get instance(): SessionManager {
//     if (!this._instance) {
//       this._instance = new SessionManager();
//     }
//     return this._instance;
//   }

//   public async initSession(userId: string): Promise<void> {
//     const keySet = await DatabaseService.getKeysFromStorage();
//     const sessionDuration = await SessionManager.getSessionDuration();

//     if (!keySet) {
//       this._currentSession = {
//         userId,
//         keySet: await EncryptionService.generateKeySet(),
//         settings: await this.getExtensionSettings(),
//         expiresAt: Date.now() + sessionDuration,
//       };
//       await DatabaseService.storeKeys(this._currentSession!.keySet);
//     } else {
//       this._currentSession = {
//         userId,
//         keySet,
//         settings: await this.getExtensionSettings(),
//         expiresAt: keySet.lastRotated + sessionDuration,
//       };
//     }
//   }

//   public async validateSession(): Promise<boolean> {
//     if (!this._currentSession) return false;
//     if (this._currentSession.expiresAt < Date.now()) {
//       await this.endSession();
//       return false;
//     }
//     return true;
//   }

//   public async endSession(): Promise<void> {
//     if (this._currentSession) {
//       await DatabaseService.clearStorage();
//       this._currentSession = null;
//     }
//   }

//   public getKeySet(): KeySet {
//     if (!this._currentSession) {
//       throw new Error("No active session found");
//     }
//     return this._currentSession.keySet;
//   }

//   public async getExtensionSettings(): Promise<ExtensionSettings> {
//     const settings = await DatabaseService.getExtensionSettings();
//     if (!settings) {
//       throw new Error("Extension settings not found");
//     }
//     return settings;
//   }

//   private static async getSessionDuration(): Promise<number> {
//     const settings = await DatabaseService.getExtensionSettings();
//     return settings?.dataRetentionTime || 30 * 24 * 60 * 60 * 1000; // 30 days
//   }

//   private _idleTimeout: ReturnType<typeof setTimeout> | null = null;

//   private async startIdleDetection(): Promise<void> {
//     this._idleTimeout = setTimeout(async () => {
//       await this.endSession();
//     }, await SessionManager.getIdleTimeout());
//   }

//   private resetIdleDetection(): void {
//     if (this._idleTimeout) {
//       clearTimeout(this._idleTimeout);
//       this.startIdleDetection();
//     }
//   }

//   private static async getIdleTimeout(): Promise<number> {
//     const settings = await DatabaseService.getExtensionSettings();
//     return settings?.dataRetentionTime || 30 * 60 * 1000; // 30 minutes
//   }

//   private static _offlineChanges: Array<{
//     id: string;
//     action: "create" | "update" | "delete";
//     data: EncryptedPassword;
//   }> = [];

//   public static async queueOfflineChange(
//     id: string,
//     action: "create" | "update" | "delete",
//     data: EncryptedPassword
//   ): Promise<void> {
//     this._offlineChanges.push({ id, action, data });
//   }

//   public static async syncOfflineChanges(): Promise<void> {
//     for (const change of this._offlineChanges) {
//       try {
//         switch (change.action) {
//           case "create":
//           case "update":
//             await DatabaseService.storeEncryptedPassword(change.data);
//             break;
//           case "delete":
//             await DatabaseService.deleteEncryptedPassword(change.id);
//             break;
//         }
//       } catch (error) {
//         console.error(
//           `Error syncing offline change (${change.action}) for ${change.id}:`,
//           error
//         );
//       }
//     }
//     this._offlineChanges = [];
//   }

//   public async verifyBiometric(biometricData: string): Promise<boolean> {
//     if (!this._currentSession?.keySet.biometric) return false;
//     return EncryptionService.verifyZKP(
//       biometricData,
//       this._currentSession.keySet.biometric.key,
//       this._currentSession.keySet.biometric.key
//     );
//   }

//   private async getSessionForDevice(deviceId: string): Promise<{
//     userId: string;
//     keySet: KeySet;
//     settings: ExtensionSettings;
//     expiresAt: number;
//   } | null> {
//     // Implement logic to retrieve the session data for the given device ID
//     return null;
//   }

//   private async promptUserConfirmation(deviceId: string): Promise<boolean> {
//     return await new Promise((resolve) => {
//       resolve(confirm(`Confirm login on new device (ID: ${deviceId})?`));
//     });
//   }

//   private async synchronizeSession(deviceId: string): Promise<void> {
//     // Implement logic to synchronize the session data between devices
//   }
// }

// export default SessionManager;
