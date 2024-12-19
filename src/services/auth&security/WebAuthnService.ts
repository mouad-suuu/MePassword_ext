import { SessionManagementService } from "../sessionManagment/SessionManager";
import AdditionalMethods from "../Keys-managment/additionals";

export class WebAuthnService {
  private static readonly AUTH_TIMEOUT = 60000; // 1 minute

  public static async isWebAuthnSupported(): Promise<boolean> {
    return window.PublicKeyCredential !== undefined;
  }

  public static async registerBiometric(username: string): Promise<boolean> {
    try {
      if (!(await this.isWebAuthnSupported())) {
        throw new Error("Biometric authentication is not supported on this device");
      }

      const challenge = crypto.getRandomValues(new Uint8Array(32));
      const createCredentialOptions: PublicKeyCredentialCreationOptions = {
        challenge,
        rp: {
          name: "MePassword Extension",
          id: window.location.hostname,
        },
        user: {
          id: Uint8Array.from(username, (c) => c.charCodeAt(0)),
          name: username,
          displayName: username,
        },
        pubKeyCredParams: [
          { type: "public-key", alg: -7 }, // ES256
          { type: "public-key", alg: -257 }, // RS256
        ],
        timeout: this.AUTH_TIMEOUT,
        authenticatorSelection: {
          authenticatorAttachment: "platform",
          userVerification: "required",
          residentKey: "preferred",
        },
      };

      const credential = await navigator.credentials.create({
        publicKey: createCredentialOptions,
      });

      if (credential) {
        const biometricType = this.detectBiometricType();
        await SessionManagementService.updateSessionSettings({
          biometricVerification: true,
          biometricType: biometricType,
        });
        return true;
      }
      return false;
    } catch (error) {
      AdditionalMethods.logError("registerBiometric", error);
      throw new Error("Unable to set up biometric authentication. Please try again later.");
    }
  }

  public static async verifyBiometric(): Promise<boolean> {
    try {
      if (!(await this.isWebAuthnSupported())) {
        return false;
      }

      const challenge = crypto.getRandomValues(new Uint8Array(32));
      const assertionOptions: PublicKeyCredentialRequestOptions = {
        challenge,
        timeout: this.AUTH_TIMEOUT,
        userVerification: "required",
      };

      const assertion = await navigator.credentials.get({
        publicKey: assertionOptions,
      });

      return assertion !== null;
    } catch (error) {
      AdditionalMethods.logError("verifyBiometric", error);
      return false;
    }
  }

  public static detectBiometricType(): "face" | "fingerprint" | "none" {
    const ua = navigator.userAgent.toLowerCase();

    // Check for Windows Hello (Windows 10 and above)
    if (
      ua.includes("windows nt") &&
      parseFloat(ua.split("windows nt ")[1]) >= 10.0
    ) {
      return "face";
    }

    // Check for MacOS Touch ID
    if (ua.includes("macintosh") || ua.includes("mac os x")) {
      return "fingerprint";
    }

    // Check for Android fingerprint
    if (ua.includes("android")) {
      return "fingerprint";
    }

    return "face"; // Default to face for Windows
  }
}
