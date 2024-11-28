async function generateAndStoreRSAKeys() {
  // Generate RSA Key Pair
  const keyPair = await crypto.subtle.generateKey(
    {
      name: "RSA-OAEP",
      modulusLength: 2048, // Use 2048 bits for compatibility with the Web Crypto API
      publicExponent: new Uint8Array([1, 0, 1]), // Standard for RSA
      hash: { name: "SHA-256" },
    },
    true, // Extractable for export
    ["encrypt", "decrypt"]
  );

  // Export keys as PEM strings for storage or further use
  const publicKey = await crypto.subtle.exportKey("spki", keyPair.publicKey);
  const privateKey = await crypto.subtle.exportKey("pkcs8", keyPair.privateKey);

  // Optionally, encrypt the private key for secure storage
  const encryptedPrivateKey = await aesEncrypt(
    privateKey,
    "your-secure-passphrase"
  );
}

// Helper function to convert ArrayBuffer to Base64 string for easier handling
function arrayBufferToBase64(buffer) {
  return btoa(String.fromCharCode(...new Uint8Array(buffer)));
}

// AES Encryption using the Web Crypto API
async function aesEncrypt(data, passphrase) {
  const enc = new TextEncoder();
  const passphraseKey = await crypto.subtle.importKey(
    "raw",
    enc.encode(passphrase),
    { name: "PBKDF2" },
    false,
    ["deriveKey"]
  );

  const aesKey = await crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: enc.encode("unique-salt"), // Use a unique salt in production
      iterations: 100000,
      hash: "SHA-256",
    },
    passphraseKey,
    { name: "AES-GCM", length: 256 },
    true,
    ["encrypt", "decrypt"]
  );

  const iv = crypto.getRandomValues(new Uint8Array(12)); // AES-GCM needs a unique IV for each encryption
  const encryptedContent = await crypto.subtle.encrypt(
    {
      name: "AES-GCM",
      iv: iv,
    },
    aesKey,
    data
  );

  return {
    iv: arrayBufferToBase64(iv),
    content: arrayBufferToBase64(encryptedContent),
  };
}

generateAndStoreRSAKeys().catch(console.error);
