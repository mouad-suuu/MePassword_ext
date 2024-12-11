import { CredentialCryptoService } from "../Keys-managment/CredentialCrypto";
import { WindowsHelloVerifier } from "./WindowsHelloVerifier";
import StoringService from "../StorageService";
import EncryptionService from "../EncryptionService";
import { BaseEncryptionService } from "../Keys-managment/BaseEncryptionService";

export class NetworkSecurityService {
  private static instance: NetworkSecurityService | null = null;
  private readonly REQUEST_TIMEOUT = 30000; // 30 seconds
  private readonly MAX_RETRIES = 3;
  private retryCount: number = 0;
  private readonly SERVER_URL = process.env.REACT_APP_SERVER_URL || 'http://localhost:3000';

  private constructor() {
    console.log('Environment Variables:', {
      SERVER_URL: process.env.REACT_APP_SERVER_URL, 
    });
   
  }

  public static getInstance(): NetworkSecurityService {
    if (!this.instance) {
      this.instance = new NetworkSecurityService();
    }
    return this.instance;
  }

  private async getDeviceInfo() {
    const userAgent = navigator.userAgent;
    const browser = this.getBrowserInfo(userAgent);
    const os = this.getOSInfo(userAgent);
    return { browser, os };
  }

  private getBrowserInfo(userAgent: string): string {
    if (userAgent.includes('Chrome')) return 'Chrome';
    if (userAgent.includes('Firefox')) return 'Firefox';
    if (userAgent.includes('Safari')) return 'Safari';
    if (userAgent.includes('Edge')) return 'Edge';
    return 'Unknown Browser';
  }

  private getOSInfo(userAgent: string): string {
    if (userAgent.includes('Windows')) return 'Windows';
    if (userAgent.includes('Mac')) return 'MacOS';
    if (userAgent.includes('Linux')) return 'Linux';
    if (userAgent.includes('Android')) return 'Android';
    if (userAgent.includes('iOS')) return 'iOS';
    return 'Unknown OS';
  }

  public async secureRequest(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<Response> {
    try {
      // Verify environment before making request
      const verifier = WindowsHelloVerifier.getInstance();
      const isEnvironmentSafe = await verifier.verifyIdentity(
        "network_request"
      );

      if (!isEnvironmentSafe) {
        throw new Error("Unsafe environment detected");
      }

      // Get device information
      const deviceInfo = await this.getDeviceInfo();
      
      // Get stored credentials
      const storedKeys = await StoringService.Keys.getKeysFromStorage();
      console.log("[secureRequest] Retrieved stored keys:", {
        hasCredentials: !!storedKeys?.Credentials,
        hasAESKey: !!storedKeys?.AESKey,
        hasIV: !!storedKeys?.IV
      });
      console.log(
        "#################### Start Decrypting credentials:", storedKeys.Credentials.authToken,storedKeys.Credentials.userId,storedKeys.Credentials.password
      )
      const decryptedCredentials = await CredentialCryptoService.decryptCredentials(
          {authToken: storedKeys.Credentials.authToken, userId: storedKeys.Credentials.userId, password: storedKeys.Credentials.password, email: storedKeys.Credentials.email},
          {
              key: storedKeys.AESKey,
              iv: storedKeys.IV,
              algorithm: "AES-GCM",
              length: 256
          }
      );
      console.log(
        "#################### Decrypted credentials:", decryptedCredentials
      )
 

      // Store the auth token in the database if this is not the token storage endpoint
      if (!endpoint.includes('/api/auth/token')) {
        try {
          await this.storeAuthToken(
            decryptedCredentials.userId, 
            decryptedCredentials.authToken,
            storedKeys.Credentials.email
          );
        } catch (error) {
          console.error("[secureRequest] Failed to store auth token:", error);
          // Continue with the request even if token storage fails
        }
      }

      // Prepare headers with device information
      const headers = new Headers(options.headers);
      headers.set('Authorization', `Bearer ${decryptedCredentials.authToken}`);
      headers.set('X-Device-Browser', deviceInfo.browser);
      headers.set('X-Device-OS', deviceInfo.os);
      headers.set('X-User-ID', decryptedCredentials.userId);

      // Update options with new headers
      options.headers = headers;

      // Add security headers and request signature
      const secureOptions = await this.enhanceRequestOptions(
        options,
        decryptedCredentials.authToken,
        decryptedCredentials.userId
      );

      // Add timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(
        () => controller.abort(),
        this.REQUEST_TIMEOUT
      );

      try {
        const url = `${this.SERVER_URL}${endpoint}`;
        const response = await fetch(url, {
          ...secureOptions,
          signal: controller.signal,
        });

        // Reset retry count on successful request
        this.retryCount = 0;

        // Validate response
        await this.validateResponse(response.clone());

        return response;
      } catch (error) {
        // Handle retries for specific errors
        if (this.shouldRetry(error)) {
          return this.handleRetry(endpoint, options);
        }
        throw error;
      } finally {
        clearTimeout(timeoutId);
      }
    } catch (error) {
      console.error("Secure request failed:", error);
      throw new Error("Network request failed");
    }
  }

  private async enhanceRequestOptions(
    options: RequestInit,
    authToken: string,
    userId: string
  ): Promise<RequestInit> {
    const timestamp = new Date().toISOString();
    const nonce = crypto.randomUUID();
    
    // Generate signature for all requests
    const signature = await this.generateRequestSignature(
      options.body || '', // Pass empty string if no body
      timestamp,
      nonce,
      authToken
    );

    // Create new Headers object from existing headers
    const headers = new Headers(options.headers);
    
    // Set security headers while preserving existing ones
    headers.set('x-timestamp', timestamp);
    headers.set('x-nonce', nonce);
    headers.set('x-signature', signature);
    headers.set('Content-Type', 'application/json');
    
    // Ensure Authorization header is set
    if (!headers.has('Authorization')) {
      headers.set('Authorization', `Bearer ${authToken}`);
    }

    return {
      ...options,
      headers,
    };
  }

  private async generateRequestSignature(
    body: any,
    timestamp: string,
    nonce: string,
    authToken: string
  ): Promise<string> {
    // Include userId and server URL in the signature data for additional security
    const signatureData = {
      body,
      timestamp,
      nonce,
      authToken,
      serverUrl: this.SERVER_URL
    };

    // Convert the data to a string
    const dataString = JSON.stringify(signatureData);

    // Create a hash of the data
    const encoder = new TextEncoder();
    const data = encoder.encode(dataString);
    const hashBuffer = await crypto.subtle.digest("SHA-256", data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, "0")).join("");

    return hashHex;
  }

  private async validateResponse(response: Response): Promise<void> {
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const contentType = response.headers.get("content-type");
    if (!contentType?.includes("application/json")) {
      throw new Error("Invalid content type");
    }
  }

  private async storeAuthToken(userId: string, token: string, email: string): Promise<void> {
    try {
      console.log("[storeAuthToken] Starting token storage:", {
        userId,
        token: token,
        email
      });

      const timestamp = new Date().toISOString();
      const nonce = crypto.randomUUID();
      
      // Generate request signature
      const signature = await this.generateRequestSignature(
        { userId, token, email },
        timestamp,
        nonce,
        token
      );

      const response = await fetch(`${this.SERVER_URL}/api/auth/token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'X-Timestamp': timestamp,
          'X-Nonce': nonce,
          'X-Signature': signature,
          'X-User-ID': userId
        },
        body: JSON.stringify({ 
          userId, 
          token, 
          email 
        })
      });

      console.log("[storeAuthToken] Token storage response:", {
        status: response.status,
        ok: response.ok
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error("[storeAuthToken] Error response:", errorData);
        throw new Error(`Failed to store token: ${response.status} - ${errorData.error || 'Unknown error'}`);
      }

      console.log("[storeAuthToken] Token stored successfully");
    } catch (error) {
      console.error("[storeAuthToken] Error storing token:", error);
      throw error;
    }
  }

  private shouldRetry(error: any): boolean {
    // Retry on network errors or specific HTTP status codes
    return (
      this.retryCount < this.MAX_RETRIES &&
      (error instanceof TypeError || // Network errors
        (error instanceof Response &&
          [408, 429, 500, 502, 503, 504].includes(error.status)))
    );
  }

  private async handleRetry(
    endpoint: string,
    options: RequestInit
  ): Promise<Response> {
    this.retryCount++;
    const delay = Math.pow(2, this.retryCount) * 1000; // Exponential backoff
    await new Promise((resolve) => setTimeout(resolve, delay));
    return this.secureRequest(endpoint, options);
  }
}
