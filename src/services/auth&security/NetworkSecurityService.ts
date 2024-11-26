import { CredentialCryptoService } from "../Keys-managment/CredentialCrypto";
import { WindowsHelloVerifier } from "./WindowsHelloVerifier";
import StoringService from "../StorageService";

export class NetworkSecurityService {
  private static instance: NetworkSecurityService | null = null;
  private readonly REQUEST_TIMEOUT = 30000; // 30 seconds
  private readonly MAX_RETRIES = 3;
  private retryCount: number = 0;

  private constructor() {
    // Initialize any necessary properties
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

      // Get stored keys and decrypt credentials
      const storedKeys = await StoringService.Keys.getKeysFromStorage();
      const decryptedCredentials =
        await CredentialCryptoService.decryptCredentials(
          storedKeys.Credentials,
          {
            key: storedKeys.AESKey,
            iv: storedKeys.IV,
            algorithm: "AES-GCM",
            length: 256,
          }
        );

      // Add security headers and request signature
      const secureOptions = await this.enhanceRequestOptions(
        options,
        decryptedCredentials.authToken
      );

      // Add timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(
        () => controller.abort(),
        this.REQUEST_TIMEOUT
      );

      try {
        const url = `${decryptedCredentials.server}${endpoint}`;
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
    authToken: string
  ): Promise<RequestInit> {
    const timestamp = Date.now().toString();
    const nonce = crypto.randomUUID();

    const enhancedHeaders = {
      ...options.headers,
      Authorization: `Bearer ${authToken}`,
      "Content-Type": "application/json",
      "X-Request-Timestamp": timestamp,
      "X-Request-Nonce": nonce,
      "X-Request-Signature": await this.generateRequestSignature(
        options.body,
        timestamp,
        nonce,
        authToken
      ),
    };

    return {
      ...options,
      headers: enhancedHeaders,
      credentials: "omit",
      mode: "cors",
      cache: "no-store",
      referrerPolicy: "no-referrer",
    };
  }

  private async generateRequestSignature(
    body: any,
    timestamp: string,
    nonce: string,
    authToken: string
  ): Promise<string> {
    const data = JSON.stringify({
      body,
      timestamp,
      nonce,
      authToken: authToken.slice(-10), // Only use part of the token for signature
    });

    const encoder = new TextEncoder();
    const signature = await crypto.subtle.digest(
      "SHA-256",
      encoder.encode(data)
    );
    return Array.from(new Uint8Array(signature))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
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
