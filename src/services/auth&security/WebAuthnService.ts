import { SessionManagementService } from "../sessionManagment/SessionManager";
import AdditionalMethods from "../Keys-managment/additionals";

export class WebAuthnService {
  private static readonly AUTH_TIMEOUT = 60000; // 1 minute

  public static async isWebAuthnSupported(): Promise<boolean> {
    const isSupported = window.PublicKeyCredential !== undefined;
    console.log("WebAuthn support check:", {
      isSupported,
      PublicKeyCredential: !!window.PublicKeyCredential,
      platform: navigator.platform,
      userAgent: navigator.userAgent,
    });
    return isSupported;
  }

  public static async registerBiometric(username: string): Promise<boolean> {
    try {
      console.log("Starting biometric registration for user:", username);

      if (!(await this.isWebAuthnSupported())) {
        console.error("WebAuthn not supported in this browser");
        throw new Error("WebAuthn is not supported in this browser");
      }

      const challenge = crypto.getRandomValues(new Uint8Array(32));
      console.log("Generated challenge:", challenge);

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
          authenticatorAttachment: "platform", // Use platform authenticator (Windows Hello, Touch ID, etc.)
          userVerification: "required",
          residentKey: "preferred",
        },
      };
      console.log("Credential options:", createCredentialOptions);

      console.log("Requesting credential creation...");
      const credential = await navigator.credentials.create({
        publicKey: createCredentialOptions,
      });
      console.log("Credential created:", credential);

      if (credential) {
        console.log("Updating session settings with biometric verification");
        const biometricType = this.detectBiometricType();
        console.log("Detected biometric type:", biometricType);

        await SessionManagementService.updateSessionSettings({
          biometricVerification: true,
          biometricType: biometricType,
        });
        return true;
      }
      console.log("Credential creation failed");
      return false;
    } catch (error) {
      console.error("Error in registerBiometric:", error);
      AdditionalMethods.logError("registerBiometric", error);
      throw error;
    }
  }

  public static async verifyBiometric(): Promise<boolean> {
    try {
      console.log("Starting biometric verification");

      if (!(await this.isWebAuthnSupported())) {
        console.log("WebAuthn not supported, aborting verification");
        return false;
      }

      const challenge = crypto.getRandomValues(new Uint8Array(32));
      console.log("Generated verification challenge:", challenge);

      const assertionOptions: PublicKeyCredentialRequestOptions = {
        challenge,
        timeout: this.AUTH_TIMEOUT,
        userVerification: "required",
      };
      console.log("Assertion options:", assertionOptions);

      console.log("Requesting credential verification...");
      const assertion = await navigator.credentials.get({
        publicKey: assertionOptions,
      });
      console.log("Verification result:", assertion);

      return assertion !== null;
    } catch (error) {
      console.error("Error in verifyBiometric:", error);
      AdditionalMethods.logError("verifyBiometric", error);
      return false;
    }
  }

  public static detectBiometricType(): "face" | "fingerprint" | "none" {
    const ua = navigator.userAgent.toLowerCase();
    console.log("Detecting biometric type for user agent:", ua);

    // Check for Windows Hello (Windows 10 and above)
    if (
      ua.includes("windows nt") &&
      parseFloat(ua.split("windows nt ")[1]) >= 10.0
    ) {
      console.log("Detected Windows Hello (face recognition)");
      return "face";
    }

    // Check for MacOS Touch ID
    if (ua.includes("macintosh") || ua.includes("mac os x")) {
      console.log("Detected Touch ID");
      return "fingerprint";
    }

    // Check for Android fingerprint
    if (ua.includes("android")) {
      console.log("Detected Android fingerprint");
      return "fingerprint";
    }

    console.log("Defaulting to face recognition for Windows");
    return "face"; // Default to face for Windows
  }
}
