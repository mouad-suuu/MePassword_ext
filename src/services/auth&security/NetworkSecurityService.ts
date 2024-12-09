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
      const storedKeys = await StoringService.Keys.getKeysFromStorage();
      const decryptedCredentials = await CredentialCryptoService.decryptCredentials(
          storedKeys.Credentials,
          {
              key: storedKeys.AESKey,
              iv: storedKeys.IV,
              algorithm: "AES-GCM",
              length: 256
          }
      );

      // Store the auth token in the database if this is not the token storage endpoint
      if (!endpoint.includes('/api/auth/token')) {
        try {
          await this.storeAuthToken(
            decryptedCredentials.userId, 
            decryptedCredentials.authToken,
            decryptedCredentials.email
          );
        } catch (error) {
          console.error("[secureRequest] Failed to store auth token:", error);
          // Continue with the request even if token storage fails
        }
      }

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
    // Create headers if they don't exist
    const headers = new Headers(options.headers || {});
    
    // Set required headers without overwriting existing ones unless necessary
    if (!headers.has("Authorization")) {
      headers.set("Authorization", `Bearer ${authToken}`);
    }
    if (!headers.has("X-User-ID")) {
      headers.set("X-User-ID", userId);
    }
    
    // Add required security headers
    headers.set("X-Timestamp", new Date().toISOString());
    headers.set("X-Nonce", crypto.randomUUID());
    
    // Generate signature
    const signatureData = await this.generateRequestSignature(
      options.body ? JSON.stringify(options.body) : "",
      new Date().toISOString(),
      headers.get("X-Nonce") || "",
      authToken
    );
    headers.set("X-Signature", signatureData);
    
    // Set Content-Type only if not already set and we have a body
    if (!headers.has("Content-Type") && options.body) {
      headers.set("Content-Type", "application/json");
    }

    return {
      ...options,
      headers,
      credentials: "include", // Add this to ensure cookies are sent
    };
  }

  private async generateRequestSignature(
    body: any,
    timestamp: string,
    nonce: string,
    authToken: string
  ): Promise<string> {
    const result = await StoringService.Keys.getKeysFromStorage();
    const storedKeys = await BaseEncryptionService.CredentialCrypto.decryptCredentials(
      result.Credentials,
      {
        key: result.AESKey,
        iv: result.IV,
        algorithm: "AES-GCM",
        length: 256,
      }
    )
    console.log("Stored keys:", storedKeys);
    // Include userId and server URL in the signature data for additional security
    const signatureData = {
      body,
      timestamp,
      nonce,
      authToken: storedKeys.authToken,
      userId: storedKeys.userId,
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
      const timestamp = new Date().toISOString();
      const nonce = crypto.randomUUID();
      
      // Generate request signature
      const signature = await this.generateRequestSignature(
        { userId, token: `Bearer ${token}`, email },
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
          token: `Bearer ${token}`,
          email 
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
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
