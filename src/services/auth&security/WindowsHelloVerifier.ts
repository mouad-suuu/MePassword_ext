import { SecureMemory } from "./SecureMemory";
import { WebAuthnService } from "./WebAuthnService";

export class WindowsHelloVerifier {
  private static instance: WindowsHelloVerifier | null = null;
  private static readonly MAX_RETRIES = 3;
  private failedAttempts: number = 0;
  private isHandlingViolation: boolean = false;

  private constructor() {
    this.initializeProtections();
  }

  public static getInstance(): WindowsHelloVerifier {
    if (!this.instance) {
      this.instance = new WindowsHelloVerifier();
    }
    return this.instance;
  }

  private initializeProtections(): void {
    this.setupTamperDetection();
    this.monitorEnvironment();
  }

  // Back: This method should be restored with full security checks after development
  // Original implementation is commented out below
  public async verifyIdentity(operation: string): Promise<boolean> {
   
    
    // Original implementation:
    try {
      // Perform environment checks
      const environmentSafe = await this.verifyEnvironment();
      if (!environmentSafe) {
        this.handleSecurityViolation("Unsafe environment detected");
        return false;
      }

      // Reset counters on success
      this.resetSecurityCounters();
      return true;
    } catch (error) {
      this.handleSecurityViolation("Verification error occurred");
      return false;
    }

  }

  private async verifyEnvironment(): Promise<boolean> {
    try {
      const checks = await Promise.all([
        this.checkVirtualization(),
        this.checkDebugger(),
        this.checkTPMAvailability(),
        this.checkSecureContext(),
      ]);

      return checks.every((check) => check === true);
    } catch {
      return false;
    }
  }

  private async checkVirtualization(): Promise<boolean> {
    const indicators = [
      navigator.hardwareConcurrency < 2,
      !navigator.platform.toLowerCase().includes("win"),
      /virtual|vmware|parallels/i.test(navigator.userAgent),
    ];

    return !indicators.some((indicator) => indicator === true);
  }

  private async checkTPMAvailability(): Promise<boolean> {
    try {
      const available =
        await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
      return available === true;
    } catch {
      return false;
    }
  }

  private checkSecureContext(): boolean {
    return window.isSecureContext === true;
  }

  private checkDebugger(): boolean {
    const startTime = performance.now();
   // debugger;
    return performance.now() - startTime < 100;
  }

  private setupTamperDetection(): void {
    const devToolsCheck = () => {
      const threshold = 160;
      const widthThreshold = window.outerWidth - window.innerWidth > threshold;
      const heightThreshold =
        window.outerHeight - window.innerHeight > threshold;

      if (widthThreshold || heightThreshold) {
        this.handleSecurityViolation("DevTools detected");
      }
    };

    window.addEventListener("resize", devToolsCheck);
    setInterval(devToolsCheck, 1000);

    // Modified console protection to prevent infinite loops
    const originalConsole = { ...console };
    Object.defineProperty(window, "console", {
      get: () => {
        if (!this.isHandlingViolation) {
          this.handleSecurityViolation("Console access attempted");
        }
        return originalConsole;
      },
    });
  }

  private monitorEnvironment(): void {
    if (chrome?.runtime?.getManifest()?.permissions?.includes("debugger")) {
      this.handleSecurityViolation("Debugging permission detected");
    }

    navigator.mediaDevices?.enumerateDevices().then((devices) => {
      const hasScreenCapture = devices.some(
        (device) =>
          device.kind === "videoinput" &&
          device.label.toLowerCase().includes("screen")
      );
      if (hasScreenCapture) {
        this.handleSecurityViolation("Screen capture detected");
      }
    });
  }

  private handleFailedAttempt(): void {
    this.failedAttempts++;
    if (this.failedAttempts >= WindowsHelloVerifier.MAX_RETRIES) {
      this.handleSecurityViolation("Max verification attempts exceeded");
    }
  }

  private handleSecurityViolation(reason: string): void {
    if (this.isHandlingViolation) return;

    try {
      this.isHandlingViolation = true;

      // Log the violation securely
      // console.error(`Security violation: ${reason}`); Back

      // Clear sensitive data
      SecureMemory.getInstance().clearAll();

      // Reset the state
      this.resetSecurityCounters();

      // Force logout/cleanup
      // chrome.runtime.sendMessage({ type: "SECURITY_VIOLATION", reason }); Back
    } finally {
      this.isHandlingViolation = false;
    }
  }

  private resetSecurityCounters(): void {
    this.failedAttempts = 0;
  }
}
