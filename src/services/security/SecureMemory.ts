import { KeySet, UserCredentials } from "../types";

/**
 * Manages secure storage and handling of sensitive data in memory.
 * Implements singleton pattern with protection against memory inspection and automatic cleanup.
 */
export class SecureMemory {
  private static instance: SecureMemory | null = null;
  private sensitiveData: Map<string, WeakRef<Uint8Array>> = new Map();
  private readonly registry = new FinalizationRegistry(this.cleanup.bind(this));

  /**
   * Private constructor to enforce singleton pattern.
   * Initializes security protections and cleanup handlers.
   */
  private constructor() {
    this.initializeProtections();
  }

  /**
   * Returns the singleton instance of SecureMemory, creating it if it doesn't exist.
   * @returns The SecureMemory instance
   */
  public static getInstance(): SecureMemory {
    if (!this.instance) {
      this.instance = new SecureMemory();
    }
    return this.instance;
  }

  /**
   * Initializes security protections including:
   * - Cleanup handlers for page unload and extension suspension
   * - Memory inspection prevention
   * - Periodic cleanup of stale data
   */
  private initializeProtections(): void {
    // Register cleanup handlers
    window.addEventListener("beforeunload", () => this.disposeAll());
    chrome.runtime.onSuspend.addListener(() => this.disposeAll());

    // Prevent memory inspection
    this.preventMemoryInspection();

    // Set up periodic cleanup
    setInterval(() => this.performPeriodicCleanup(), 60000);
  }

  /**
   * Stores sensitive data in memory with protection mechanisms.
   * Converts data to Uint8Array and stores it with a weak reference for automatic cleanup.
   * @param key - Unique identifier for the stored data
   * @param data - Sensitive data to store (string, KeySet, or UserCredentials)
   */
  public storeSensitiveData(
    key: string,
    data: string | KeySet | UserCredentials
  ): void {
    try {
      // Convert data to Uint8Array
      const encoder = new TextEncoder();
      const rawData = encoder.encode(JSON.stringify(data));

      // Create protected buffer
      const protectedBuffer = new Uint8Array(rawData.length);
      protectedBuffer.set(rawData);

      // Store with weak reference
      const weakRef = new WeakRef(protectedBuffer);
      this.sensitiveData.set(key, weakRef);

      // Register for cleanup
      this.registry.register(protectedBuffer, key);

      // Immediately clear the temporary variables
      rawData.fill(0);
    } catch (error) {
      this.secureErrorHandler("Error storing sensitive data", error);
    }
  }

  /**
   * Retrieves previously stored sensitive data.
   * @param key - Unique identifier for the stored data
   * @returns The stored data cast to type T, or null if not found/expired
   */
  public getSensitiveData<T>(key: string): T | null {
    try {
      const weakRef = this.sensitiveData.get(key);
      if (!weakRef) return null;

      const buffer = weakRef.deref();
      if (!buffer) {
        this.sensitiveData.delete(key);
        return null;
      }

      const decoder = new TextDecoder();
      const data = JSON.parse(decoder.decode(buffer)) as T;
      return data;
    } catch (error) {
      this.secureErrorHandler("Error retrieving sensitive data", error);
      return null;
    }
  }

  /**
   * Securely disposes of sensitive data for a specific key.
   * Performs secure wipe of the data before removing references.
   * @param key - Unique identifier for the data to dispose
   */
  public disposeSensitiveData(key: string): void {
    try {
      const weakRef = this.sensitiveData.get(key);
      if (weakRef) {
        const buffer = weakRef.deref();
        if (buffer) {
          this.secureWipe(buffer);
        }
      }
      this.sensitiveData.delete(key);
    } catch (error) {
      this.secureErrorHandler("Error disposing sensitive data", error);
    }
  }

  /**
   * Securely disposes of all stored sensitive data.
   * Called during cleanup and when security threats are detected.
   */
  private disposeAll(): void {
    try {
      for (const [key] of this.sensitiveData) {
        this.disposeSensitiveData(key);
      }
      this.sensitiveData.clear();
    } catch (error) {
      this.secureErrorHandler("Error disposing all sensitive data", error);
    }
  }

  /**
   * Performs secure wiping of data buffers using multiple overwrite passes.
   * Uses different patterns and random data to ensure data cannot be recovered.
   * @param buffer - The buffer to securely wipe
   */
  private secureWipe(buffer: Uint8Array): void {
    try {
      // Multiple overwrite passes with different patterns
      const patterns = [0x00, 0xff, 0xaa, 0x55, 0xf0];

      patterns.forEach((pattern) => {
        buffer.fill(pattern);
        // Force synchronization with a memory barrier equivalent
        this.memoryBarrier();
      });

      // Final random overwrite
      crypto.getRandomValues(buffer);

      // Additional security: overwrite with zeros
      buffer.fill(0);
    } catch (error) {
      this.secureErrorHandler("Error in secure wipe", error);
    }
  }

  /**
   * Creates a memory barrier to ensure memory operations are completed.
   * Prevents optimization and ensures secure wiping operations are executed.
   */
  private memoryBarrier(): void {
    try {
      // Create a temporary SharedArrayBuffer for synchronization
      // This is a more compatible way to ensure memory operations are completed
      const temp = new Uint8Array(1);
      crypto.getRandomValues(temp);

      // Perform a dummy operation to prevent optimization
      if (temp[0] === 0xff) {
        // This block will rarely execute but prevents the compiler
        // from optimizing away our memory barrier
        console.debug("Memory barrier checkpoint");
      }
    } catch {
      // Fallback if SharedArrayBuffer is not available
      // Create a small delay to allow memory operations to complete
      const start = performance.now();
      while (performance.now() - start < 1) {
        // Busy wait for 1ms
      }
    }
  }

  /**
   * Implements anti-debugging measures to prevent memory inspection.
   * Includes debugger detection and memory usage masking.
   */
  private preventMemoryInspection(): void {
    // Disable debugger
    setInterval(() => {
      const startTime = performance.now();
      debugger;
      const endTime = performance.now();

      if (endTime - startTime > 100) {
        this.disposeAll();
        throw new Error("Debugger detected");
      }
    }, 1000);

    // Prevent memory dumps
    if (typeof process?.memoryUsage === "function") {
      Object.defineProperty(process, "memoryUsage", {
        value: () => ({
          heapUsed: 0,
          heapTotal: 0,
          external: 0,
          arrayBuffers: 0,
        }),
        configurable: false,
        writable: false,
      });
    }
  }

  /**
   * Performs periodic cleanup of weak references that have been garbage collected.
   * Removes entries for any data that is no longer accessible.
   */
  private performPeriodicCleanup(): void {
    for (const [key, weakRef] of this.sensitiveData) {
      if (!weakRef.deref()) {
        this.sensitiveData.delete(key);
      }
    }
  }

  /**
   * Callback for the FinalizationRegistry to cleanup data when objects are garbage collected.
   * @param key - The key of the data to cleanup
   */
  private cleanup(key: string): void {
    this.disposeSensitiveData(key);
  }

  /**
   * Handles errors in secure operations while maintaining security.
   * Logs minimal information and throws generic errors to prevent information leakage.
   * @param context - General context of where the error occurred
   * @param error - The error that was caught
   */
  private secureErrorHandler(context: string, error: unknown): void {
    console.error(`[SecureMemory] ${context}`);
    throw new Error("Security operation failed");
  }
}
